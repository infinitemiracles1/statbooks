
import React, { useState, useCallback } from 'react';
import { BookOpen, Palette, Bot, Sparkles, Mic, Brush, HeartHandshake, Languages, Download, ArrowLeft, Award, AlertTriangle } from 'lucide-react';
import BookManager from './BookManager';
import CoverDesigner from './CoverDesigner';
import Assistant from './Assistant';
import VoiceScribe from './VoiceScribe';
import CreativeStudio from './CreativeStudio';
import BraveAuthorJourney from './BraveAuthorJourney';
import PublishingTools from './PublishingTools';
import ExportManager from './ExportManager';
import AuthorHub from './AuthorHub';
import { Book } from '../types';
import PdfGenerator from '../services/pdfGenerator';

export type Tab = 'manuscript' | 'cover' | 'assistant' | 'voice' | 'studio' | 'brave-author' | 'publishing' | 'export' | 'hub';

interface EditorProps {
    book: Book;
    onUpdateBook: (book: Book | ((prevBook: Book) => Book)) => void;
    onExit: () => void;
    initialTab: Tab;
    isGuest?: boolean;
}

const Editor: React.FC<EditorProps> = ({ book, onUpdateBook, onExit, initialTab, isGuest = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'manuscript');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
        const pdfService = new PdfGenerator(book);
        await pdfService.generatePdf();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('An error occurred while generating the PDF. Please check the console for details.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [book]);
  
  const setManuscriptFromText = (textUpdater: (prev: string) => string) => {
    const fullText = book.manuscriptParts.map(p => p.content).join('\n');
    const newText = textUpdater(fullText);
    // This is a simplified update, ideally it should re-parse into chapters.
    // For now, it updates the first chapter's content.
    const firstChapterIndex = book.manuscriptParts.findIndex(p => p.type === 'Chapter');
    if (firstChapterIndex !== -1) {
        const updatedParts = [...book.manuscriptParts];
        updatedParts[firstChapterIndex] = { ...updatedParts[firstChapterIndex], content: newText };
        onUpdateBook({ ...book, manuscriptParts: updatedParts });
    }
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'manuscript':
        return <BookManager book={book} onUpdateBook={onUpdateBook} />;
      case 'cover':
        return <CoverDesigner manuscript={book.manuscriptParts.map(p => p.content).join('\n')} bookSettings={book.settings} />;
      case 'assistant':
        return <Assistant book={book} onUpdateBook={onUpdateBook} />;
      case 'voice':
        return <VoiceScribe setManuscript={setManuscriptFromText} />;
      case 'studio':
        return <CreativeStudio coloringPages={[]} setColoringPages={() => {}} />; // Needs adapting to book state
      case 'brave-author':
        return <BraveAuthorJourney setManuscript={setManuscriptFromText} />;
      case 'publishing':
        return <PublishingTools book={book} onUpdateBook={onUpdateBook} />;
      case 'export':
        return <ExportManager book={book} onUpdateBook={onUpdateBook} onExport={handleDownloadPdf} isExporting={isGeneratingPdf} />;
      case 'hub':
          return <AuthorHub book={book} onUpdateBook={onUpdateBook} />;
      default:
        return null;
    }
  };
  
  const NavItem: React.FC<{ tab: Tab; icon: React.ReactNode; label: string; disabled?: boolean }> = ({ tab, icon, label, disabled = false }) => (
    <button
      onClick={() => !disabled && setActiveTab(tab)}
      disabled={disabled}
      className={`flex flex-col items-center justify-center w-full h-20 text-xs md:text-sm md:flex-row md:justify-start md:h-auto md:py-3 md:px-4 rounded-lg transition-colors duration-200 ${ activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={disabled ? `${label} (Sign in to use)` : label}
    >
      <span className="mb-1 md:mb-0 md:mr-3">{icon}</span>
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
  
  const GuestModeBanner = () => (
    <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-sm font-semibold p-2 flex items-center justify-center z-50 shadow-md">
      <AlertTriangle size={16} className="mr-2" />
      You are in Guest Mode. Your work will not be saved.
      <button onClick={onExit} className="ml-4 bg-yellow-800 text-white py-1 px-3 rounded-full hover:bg-yellow-900 transition-colors">
        Sign Up to Save
      </button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans relative">
      {isGuest && <GuestModeBanner />}
      <nav className={`flex flex-row md:flex-col w-full md:w-20 lg:w-64 bg-white dark:bg-gray-800 p-2 md:p-4 shadow-lg overflow-x-auto md:overflow-visible ${isGuest ? 'pt-10 md:pt-4' : ''}`}>
        <div className="flex items-center mb-0 md:mb-8 mt-0 md:mt-2 flex-shrink-0">
          <button onClick={onExit} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <ArrowLeft size={24}/>
          </button>
          <h1 className="hidden lg:block ml-2 text-xl font-bold text-gray-800 dark:text-white truncate" title={book.title}>{book.title}</h1>
        </div>
        <div className="flex flex-row md:flex-col w-full space-x-2 md:space-x-0 md:space-y-3">
          <NavItem tab="manuscript" icon={<BookOpen size={24} />} label="Manuscript" />
          <NavItem tab="brave-author" icon={<HeartHandshake size={24} />} label="Brave Author" />
          <NavItem tab="hub" icon={<Award size={24} />} label="Author Hub" disabled={isGuest} />
          <NavItem tab="cover" icon={<Palette size={24} />} label="Cover Design" />
          <NavItem tab="studio" icon={<Brush size={24} />} label="Creative Studio" />
          <NavItem tab="assistant" icon={<Bot size={24} />} label="AI Writer" />
          <NavItem tab="voice" icon={<Mic size={24} />} label="Voice Scribe" />
          <NavItem tab="publishing" icon={<Languages size={24} />} label="Publishing Tools" disabled={isGuest} />
          <NavItem tab="export" icon={<Download size={24} />} label="Export" disabled={isGuest} />
        </div>
      </nav>
      <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${isGuest ? 'pt-12 md:pt-8' : ''}`}>
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Editor;
