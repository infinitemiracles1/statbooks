
import { PDFDocument, rgb, StandardFonts, PDFFont, PageSizes, PngEmbedder, JpegEmbedder, Fontkit } from 'pdf-lib';
import { Book, ManuscriptPart, Chapter } from '../types';
import fontkit from 'https://cdn.skypack.dev/@pdf-lib/fontkit';


type TocEntry = {
    title: string;
    pageNumber: number;
    ref: any; 
};

export default class PdfGenerator {
  private book: Book;

  constructor(book: Book) {
    this.book = book;
  }
  
  private static async downloadPdf(pdfBytes: Uint8Array, title: string) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public static async generateColoringBookPdf(images: string[], settings: any): Promise<void> {
    // ... [existing coloring book logic remains the same]
  }

  private async getFonts(pdfDoc: PDFDocument) {
    // This is a simplified theme engine. A real one would be more complex.
    const { theme } = this.book.exportSettings;
    const { fontFamily } = this.book.settings;
    
    // For simplicity, we'll use standard fonts. For custom fonts like Merriweather:
    // const fontBytes = await fetch('/path/to/merriweather.ttf').then(res => res.arrayBuffer());
    // const customFont = await pdfDoc.embedFont(fontBytes);
    
    let bodyFont, boldFont, italicFont, boldItalicFont;

    switch (theme) {
        case 'Romance':
            bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
            break;
        case 'Reedsy':
             bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
             boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            break;
        case 'Classic':
        default:
             bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
             boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
             break;
    }

    return { bodyFont, boldFont };
  }


  async generatePdf(): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const { bodyFont, boldFont } = await this.getFonts(pdfDoc);

    const { settings, copyright, manuscriptParts, exportSettings } = this.book;
    const { trimSize, fontSize, lineHeight } = settings;
    const pageWidth = trimSize.widthInches * 72;
    const pageHeight = trimSize.heightInches * 72;
    const margin = 72;
    const textWidth = pageWidth - margin * 2;
    const tocEntries: TocEntry[] = [];
    
    const addPage = () => pdfDoc.addPage([pageWidth, pageHeight]);
    
    // --- RENDER TITLE PAGE ---
    let currentPage = addPage();
    const titleY = pageHeight / 2 + 100;
    currentPage.drawText(settings.title, { x: margin, y: titleY, font: boldFont, size: 36, maxWidth: textWidth, align: 'center' });
    if (settings.subtitle) {
      currentPage.drawText(settings.subtitle, { x: margin, y: titleY - 40, font: bodyFont, size: 24, maxWidth: textWidth, align: 'center' });
    }
    currentPage.drawText(settings.author, { x: margin, y: titleY - 100, font: bodyFont, size: 24, maxWidth: textWidth, align: 'center' });

    // --- RENDER COPYRIGHT PAGE ---
    const copyrightPart = manuscriptParts.find(p => p.type === 'Copyright');
    if (copyrightPart) {
      currentPage = addPage();
      let y = pageHeight - margin;
      const drawLine = (text: string, size = 10, font = bodyFont) => {
        if (y < margin) { currentPage = addPage(); y = pageHeight - margin; }
        currentPage.drawText(text, {x: margin, y, size, font, lineHeight: size * 1.2});
        y -= size * 1.2;
      }
      
      drawLine(settings.title, 12, boldFont);
      drawLine(`Copyright © ${copyright.year} ${copyright.penName || settings.author}`);
      y -= 10;

      if (copyright.clauses.allRightsReserved) drawLine("All rights reserved.");
      if (copyright.clauses.fiction) drawLine("This is a work of fiction. Names, characters, businesses, places, events, and incidents are either the products of the author's imagination or used in a fictitious manner...");
      // ... Add all other clauses
      
      y -= 10;
      if (copyright.publisherName) drawLine(`Published by ${copyright.publisherName}`);
      Object.entries(copyright.isbns).forEach(([key, value]) => {
          if (value) drawLine(`ISBN (${key.toUpperCase()}): ${value}`);
      });
       y-= 10;
       drawLine(`Cover design by ${settings.author} using Typesetter AI.`);
       drawLine(`Interior design by Typesetter AI.`);
    }

    // --- RENDER OTHER FRONT MATTER ---
    const frontMatter = manuscriptParts.filter(p => ['Dedication', 'Epigraph', 'Preface'].includes(p.type));
    for (const part of frontMatter) {
      currentPage = addPage();
      let y = pageHeight - margin;
       currentPage.drawText(part.title, {x: margin, y, font: boldFont, size: 24});
       y -= 40;
       // ... render part.content
    }

    const tocPageRef = settings.includeTOC ? addPage() : null;
    const bodyStartIndex = pdfDoc.getPageCount();

    // --- RENDER BODY (PARTS AND CHAPTERS) ---
    const bodyParts = manuscriptParts.filter(p => ['Part', 'Chapter'].includes(p.type));
    for (const part of bodyParts) {
        currentPage = addPage();
        tocEntries.push({ title: part.title, pageNumber: pdfDoc.getPageCount() - bodyStartIndex + 1, ref: currentPage });
        
        let y = pageHeight - margin;
        
        currentPage.setFont(boldFont);
        currentPage.setFontSize(part.type === 'Part' ? 24 : 18);
        currentPage.drawText(part.title, { x: margin, y, maxWidth: textWidth });
        y -= (currentPage.getSize().height - y) * 2;
        currentPage.setFont(bodyFont);
        currentPage.setFontSize(fontSize);

        const paragraphs = part.content.split('\n').filter(p => p.trim() !== '');
        for (const [pIndex, paragraph] of paragraphs.entries()) {
            const lines = this.wrapText(paragraph, textWidth, bodyFont, fontSize);

            // DROP CAP LOGIC
            if (exportSettings.useDropCaps && pIndex === 0 && lines.length > 0) {
                const firstLetter = lines[0][0];
                const restOfFirstLine = lines[0].substring(1);
                const dropCapSize = fontSize * 3;
                
                currentPage.drawText(firstLetter, { x: margin, y, font: boldFont, size: dropCapSize });
                const firstLetterWidth = boldFont.widthOfTextAtSize(firstLetter, dropCapSize);
                
                currentPage.drawText(restOfFirstLine, { x: margin + firstLetterWidth + 3, y });
                y -= fontSize * lineHeight;

                for (let i = 1; i < lines.length; i++) {
                   if (y < margin) { currentPage = addPage(); y = pageHeight - margin; }
                   let lineX = margin;
                   // Indent lines that are next to the drop cap
                   if (y > (pageHeight - margin - dropCapSize)) {
                       lineX += firstLetterWidth + 3;
                   }
                   currentPage.drawText(lines[i], { x: lineX, y });
                   y -= fontSize * lineHeight;
                }
            } else {
                 for (const line of lines) {
                    if (y < margin) { currentPage = addPage(); y = pageHeight - margin; }
                    currentPage.drawText(line, { x: margin, y });
                    y -= fontSize * lineHeight;
                }
            }
            y -= (fontSize * lineHeight) / 2; // Paragraph spacing
        }
    }

    // --- RENDER TABLE OF CONTENTS ---
    if (settings.includeTOC && tocPageRef) {
      let y = pageHeight - margin;
      tocPageRef.drawText('Table of Contents', { x: margin, y, font: boldFont, size: 24 });
      y -= 48;
      // ... [TOC rendering logic as before, using tocEntries]
    }

    // --- RENDER PAGE NUMBERS ---
    const pages = pdfDoc.getPages();
    for (let i = bodyStartIndex -1; i < pages.length; i++) {
       pages[i].drawText(`${i - bodyStartIndex + 2}`, {
            x: pageWidth / 2, y: margin / 2, size: 10, font: bodyFont, color: rgb(0.5, 0.5, 0.5),
        });
    }

    const pdfBytes = await pdfDoc.save();
    PdfGenerator.downloadPdf(pdfBytes, settings.title);
  }

  private wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width < maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
  }
}
