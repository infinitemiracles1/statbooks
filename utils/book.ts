
import { Book, CopyrightSettings, ExportSettings, ManuscriptPart, BookSettings } from '../types';
import { KDP_TRIM_SIZES, FONT_FAMILIES, BOOK_THEMES } from '../constants';

export const getInitialBook = (): Book => {
  const newId = self.crypto.randomUUID();

  const initialCopyrightSettings: CopyrightSettings = {
    penName: '',
    edition: 'First edition',
    year: new Date().getFullYear().toString(),
    isbns: { epub: '', kindle: '', paperback: '', hardcover: '', pdf: '' },
    publisherName: '',
    publisherLogo: null,
    clauses: {
      allRightsReserved: true,
      fiction: false,
      moralRights: true,
      externalContent: true,
      designations: true,
      custom: '',
    },
  };

  const initialManuscriptParts: ManuscriptPart[] = [
    { id: self.crypto.randomUUID(), type: 'Copyright', title: 'Copyright', content: '' },
    { id: self.crypto.randomUUID(), type: 'Dedication', title: 'Dedication', content: 'For those who dare to write.' },
    { id: self.crypto.randomUUID(), type: 'Chapter', title: 'Chapter 1', content: 'It was a dark and stormy night...' },
  ];
  
  const initialExportSettings: ExportSettings = {
    theme: 'Classic',
    useDropCaps: true,
    hideChapterNumbers: false,
  };

  const initialBookSettings: BookSettings = {
    title: 'Untitled Book',
    subtitle: '',
    author: 'A Brave Author',
    trimSize: KDP_TRIM_SIZES[3], // 6x9
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Merriweather',
    includeTOC: true,
  };

  return {
    id: newId,
    title: 'Untitled Book',
    author: 'A Brave Author',
    lastModified: Date.now(),
    settings: initialBookSettings,
    manuscriptParts: initialManuscriptParts,
    copyright: initialCopyrightSettings,
    exportSettings: initialExportSettings,
    coverDesign: {},
    achievements: [],
  };
};
