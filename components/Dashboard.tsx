
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Book as BookIcon, PlusCircle, Upload, Trash2, Feather, LogOut, BookOpen, Palette, BookAudio, User, Lock, Smile, Sparkles, AlertTriangle } from 'lucide-react';
import { Book as BookType } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Tab } from './Editor';

interface DashboardProps {
  userMode: 'visitor' | 'author';
  books: BookType[];
  onSelectBook: (bookId: string, tab?: Tab) => void;
  onCreateNewBook: () => void;
  onImportBook: (file: File) => void;
  onDeleteBook: (bookId: string) => void;
  onLogout: () => void;
  onGoToLogin: () => void;
  onStartGuestSession: () => void;
  onStartKidsGuestSession: () => void;
  isImporting: boolean;
  mostRecentBook: BookType | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userMode, books, onSelectBook, onCreateNewBook, onImportBook, onDeleteBook, onLogout, onGoToLogin, onStartGuestSession, onStartKidsGuestSession, isImporting, mostRecentBook }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quote, setQuote] = useState('');
  const [isQuoteLoading, setIsQuoteLoading] = useState(true);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      setIsQuoteLoading(true);
      if (!process.env.API_KEY) {
        setQuote("Add your API Key in Vercel to enable AI features.");
        setIsQuoteLoading(false);
        setApiKeyMissing(true);
        return;
      }
      setApiKeyMissing(false);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a short, inspiring, one-sentence quote for a writer. It should be uplifting and focus on the power of storytelling and courage. Do not include quotation marks in the response.",
        });
        setQuote(response.text);
      } catch (error) {
        console.error("Failed to fetch quote:", error);
        setQuote("Every story you tell is a universe you create.");
      } finally {
        setIsQuoteLoading(false);
      }
    };
    fetchQuote();
  }, []);

  const handleFileImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImportBook(file);
  };
  
  const BookCard: React.FC<{ book: BookType }> = ({ book }) => (
    <div 
        onClick={() => onSelectBook(book.id)}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
       <div className="flex-grow">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate">{book.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">by {book.author}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Modified: {new Date(book.lastModified).toLocaleDateString()}
        </p>
       </div>
       <button 
        onClick={(e) => {
            e.stopPropagation();
            if(window.confirm(`Delete "${book.title}"?`)) onDeleteBook(book.id);
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
        aria-label="Delete book"
       >
           <Trash2 size={16} />
       </button>
    </div>
  );

  const FeatureWidget: React.FC<{onClick: () => void, icon: React.ReactNode, title: string, description: string, locked?: boolean}> = ({onClick, icon, title, description, locked}) => {
    const content = (
      <>
        <div className={`p-3 rounded-full ${locked ? 'bg-gray-200 dark:bg-gray-700 text-gray-400' : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'}`}>
            {icon}
        </div>
        <div>
            <h4 className={`font-bold ${locked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </>
    );

    return locked ? (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm text-left flex items-center gap-4 transition-all relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-400/10 backdrop-blur-sm z-10 flex items-center justify-center">
            <button onClick={onClick} className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-full hover:bg-blue-700 transition-colors text-sm shadow-md flex items-center gap-2">
              <Lock size={14} /> Unlock Feature
            </button>
        </div>
        {content}
      </div>
    ) : (
      <button
        onClick={onClick}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm text-left flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5"
      >
        {content}
      </button>
    );
  };

  const isAuthor = userMode === 'author';

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-6 md:p-8 bg-white dark:bg-gray-800 shadow-sm relative">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
          {isAuthor ? 'Author Dashboard' : 'AuthorOS'}
        </h1>
        <div className={`mt-3 italic flex items-start h-6 ${apiKeyMissing ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {apiKeyMissing ? <AlertTriangle size={18} className="mr-3 mt-1 flex-shrink-0" /> : <Feather size={18} className="mr-3 mt-1 flex-shrink-0 text-gray-400" />}
          {isQuoteLoading ? (
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
          ) : (
            <p>{apiKeyMissing ? <strong>{quote}</strong> : `"${quote}"`}</p>
          )}
        </div>
        {isAuthor ? (
           <button onClick={onLogout} className="absolute top-6 right-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
            <LogOut size={16} />
            Sign Out
           </button>
        ) : (
           <button onClick={onGoToLogin} className="absolute top-6 right-6 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors bg-blue-100 dark:bg-blue-900/50 py-2 px-4 rounded-full">
            <User size={16} />
            Author Portal
           </button>
        )}
      </header>

      <main className="flex-grow p-4 md:p-8 overflow-y-auto space-y-8">
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Author Toolkit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureWidget 
                    icon={<BookOpen size={24} />}
                    title={isAuthor ? "Continue Writing" : "Manage Your Books"}
                    description={isAuthor ? (mostRecentBook ? `Jump back into "${mostRecentBook.title}"` : "Start a new book") : "Sign in to save and manage projects."}
                    onClick={isAuthor ? () => mostRecentBook ? onSelectBook(mostRecentBook.id, 'manuscript') : onCreateNewBook() : onGoToLogin}
                    locked={!isAuthor}
                />
                 <FeatureWidget 
                    icon={<Palette size={24} />}
                    title="Design Cover"
                    description="Create a stunning cover for your book."
                    locked={!isAuthor}
                    onClick={isAuthor ? () => mostRecentBook && onSelectBook(mostRecentBook.id, 'cover') : onGoToLogin}
                />
                 <FeatureWidget 
                    icon={<BookAudio size={24} />}
                    title="Create Audiobook"
                    description="Generate an AI-narrated audiobook."
                    locked={!isAuthor}
                    onClick={isAuthor ? () => mostRecentBook && onSelectBook(mostRecentBook.id, 'publishing') : onGoToLogin}
                />
            </div>
        </div>

        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {isAuthor ? "My Bookshelf" : "Begin Your Journey"}
            </h2>
            {isAuthor ? (
               <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {books.map(book => (
                    <BookCard key={book.id} book={book} />
                ))}
                <button
                    onClick={onCreateNewBook}
                    className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-gray-500 dark:text-gray-400 transition-colors hover:border-blue-500 hover:text-blue-500"
                >
                    <PlusCircle size={32} />
                    <span className="font-semibold mt-2">New Book</span>
                </button>
                 <button
                    onClick={handleFileImportClick}
                    disabled={isImporting}
                    className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-gray-500 dark:text-gray-400 transition-colors hover:border-green-500 hover:text-green-500 disabled:opacity-50"
                >
                    {isImporting ? ( <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : <Upload size={32} />}
                    <span className="font-semibold mt-2">{isImporting ? 'Importing...' : 'Import Book'}</span>
                </button>
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col items-center justify-center">
                            <BookIcon className="text-blue-500 mb-4" size={48} />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Try the Editor</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                                Experience the full-featured editor in guest mode. Your work won't be saved.
                            </p>
                            <button onClick={onStartGuestSession} className="mt-6 bg-gray-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors text-lg">
                                Launch Guest Editor
                            </button>
                        </div>
                        <div className="text-center p-8 bg-blue-50 dark:bg-blue-900/50 rounded-lg shadow-sm flex flex-col items-center justify-center border border-blue-200 dark:border-blue-800">
                            <User className="text-blue-500 mb-4" size={48} />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Ready to Write?</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                                Sign in to the Author Portal to save projects and access all AI publishing tools.
                            </p>
                            <button onClick={onGoToLogin} className="mt-6 bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors text-lg">
                                Go to Author Portal
                            </button>
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">For Young Authors</h3>
                        <div className="w-24 h-1 bg-purple-500 mx-auto mt-2 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col items-center justify-center">
                            <Smile className="text-purple-500 mb-4" size={48} />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Try the Kids Editor</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                                A fun and simple editor for kids to write their first story.
                            </p>
                            <button onClick={onStartKidsGuestSession} className="mt-6 bg-purple-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-600 transition-colors text-lg">
                                Launch Kids Editor
                            </button>
                        </div>
                        <div className="text-center p-8 bg-purple-50 dark:bg-purple-900/50 rounded-lg shadow-sm flex flex-col items-center justify-center border border-purple-200 dark:border-purple-800">
                             <Sparkles className="text-purple-500 mb-4" size={48} />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Ready to Save Your Story?</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                                Join the Kids Author Portal to save your amazing stories and share them!
                            </p>
                            <button onClick={onGoToLogin} className="mt-6 bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors text-lg">
                                Go to Kids Author Portal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.pdf,.docx"/>
    </div>
  );
};

export default Dashboard;
