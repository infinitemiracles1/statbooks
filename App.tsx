
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Dashboard from './components/Dashboard';
import Editor, { Tab } from './components/Editor';
import LoginScreen from './components/LoginScreen';
import { Book, ManuscriptPart } from './types';
import { getInitialBook, getInitialKidsBook } from './utils/book';

// A simple mock for parsing text from a file.
const mockParseFile = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.readAsText(file);
  });
};

type UserMode = 'visitor' | 'login' | 'author';

const App: React.FC = () => {
  const [userMode, setUserMode] = useState<UserMode>('visitor');
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const savedBooks = localStorage.getItem('kdp_pro_books');
      return savedBooks ? JSON.parse(savedBooks) : [];
    } catch (error) {
      console.error("Could not load books from local storage", error);
      return [];
    }
  });
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [guestBook, setGuestBook] = useState<Book | null>(null);
  const [initialTab, setInitialTab] = useState<Tab>('manuscript');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (userMode === 'author') {
        try {
          localStorage.setItem('kdp_pro_books', JSON.stringify(books));
        } catch (error) {
          console.error("Could not save books to local storage", error);
        }
    }
  }, [books, userMode]);

  const handleLogin = () => {
    setGuestBook(null); // Clear guest book on login
    setUserMode('author');
  }
  const handleGoToLogin = () => setUserMode('login');
  const handleLogout = () => {
      setUserMode('visitor');
      setCurrentBookId(null);
  };
  
  const handleStartGuestSession = () => {
    setGuestBook(getInitialBook());
    setInitialTab('manuscript');
  };
  
  const handleStartKidsGuestSession = () => {
    setGuestBook(getInitialKidsBook());
    setInitialTab('manuscript');
  };

  const handleUpdateGuestBook = (updatedBook: Book | ((prevBook: Book) => Book)) => {
    setGuestBook(prevGuestBook => {
        if (!prevGuestBook) return null;
        if (typeof updatedBook === 'function') {
            return updatedBook(prevGuestBook);
        }
        return updatedBook;
    });
  };

  const handleEndGuestSession = () => {
    setGuestBook(null);
  };


  const handleCreateNewBook = () => {
    const newBook = getInitialBook();
    setBooks(prev => [...prev, newBook]);
    setCurrentBookId(newBook.id);
    setInitialTab('manuscript');
  };

  const handleSelectBook = (bookId: string, tab: Tab = 'manuscript') => {
    setCurrentBookId(bookId);
    setInitialTab(tab);
  };
  
  const handleUpdateBook = (updatedBook: Book | ((prevBook: Book) => Book)) => {
    setBooks(prev => prev.map(book => {
        if (typeof updatedBook === 'function') {
            const newBook = updatedBook(book);
            return book.id === newBook.id ? { ...newBook, lastModified: Date.now() } : book;
        }
        return book.id === updatedBook.id ? { ...updatedBook, lastModified: Date.now() } : book;
    }));
  };
  
  const handleUpdateBookOrGuestBook = (updatedBook: Book | ((prevBook: Book) => Book)) => {
    if (guestBook) {
        handleUpdateGuestBook(updatedBook);
    } else {
        handleUpdateBook(updatedBook);
    }
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(prev => prev.filter(book => book.id !== bookId));
    if (currentBookId === bookId) {
      setCurrentBookId(null);
    }
  };

  const handleExitEditor = () => {
      if (guestBook) {
        handleEndGuestSession();
      } else {
        setCurrentBookId(null);
      }
  };

  const handleImportBook = useCallback(async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'pdf' || fileExtension === 'docx') {
      alert(`Sorry, importing .${fileExtension} files is not yet supported. Please use a plain text (.txt) file for now.`);
      return;
    }
    
    setIsImporting(true);
    try {
      const rawText = await mockParseFile(file);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const prompt = `You are an expert document parser for a book writing application. Analyze the following raw text from a user's manuscript and structure it into a JSON array of manuscript parts.
      
      The valid part types are: 'Copyright', 'Dedication', 'Epigraph', 'Preface', 'Part', 'Chapter'.
      
      - Identify common front matter like dedications, prefaces, etc.
      - Identify main chapters, using common headings like "Chapter 1", "Introduction", or just a title on its own line.
      - If there are clear "Part I" or "Part 1" style dividers, use the 'Part' type.
      - For each part, create an object with a "type", "title", and the full "content" of that part.
      
      The JSON output should follow this structure: [{ "type": "string", "title": "string", "content": "string" }, ...].
      
      Do not include a Table of Contents in the output, as the application generates it automatically.
      
      Here is the raw text:
      ---
      ${rawText}
      ---
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["type", "title", "content"]
            }
          }
        },
      });

      const parsedParts = JSON.parse(response.text) as Omit<ManuscriptPart, 'id'>[];
      
      const newBook = getInitialBook();
      newBook.title = file.name.replace(/\.[^/.]+$/, "");
      newBook.author = "Imported Author";
      newBook.manuscriptParts = [
        ...newBook.manuscriptParts.slice(0, 1), // Keep the initial copyright page
        ...parsedParts.map(p => ({...p, id: self.crypto.randomUUID()})) as ManuscriptPart[]
      ];

      setBooks(prev => [...prev, newBook]);
      setCurrentBookId(newBook.id);
      setInitialTab('manuscript');

    } catch (error) {
      console.error("Failed to import and parse book:", error);
      alert("An error occurred during import. Please ensure the file is plain text and the AI is able to parse it.");
    } finally {
      setIsImporting(false);
    }
  }, []);
  
  const mostRecentBook = useMemo(() => {
    if (books.length === 0) return null;
    return [...books].sort((a, b) => b.lastModified - a.lastModified)[0];
  }, [books]);

  const currentBook = books.find(book => book.id === currentBookId);

  if (userMode === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (guestBook) {
    return <Editor
            isGuest={true}
            book={guestBook}
            onUpdateBook={handleUpdateBookOrGuestBook}
            onExit={handleExitEditor}
            initialTab={initialTab}
           />;
  }

  if (userMode === 'author' && currentBook) {
    return <Editor 
            book={currentBook} 
            onUpdateBook={handleUpdateBookOrGuestBook} 
            onExit={handleExitEditor}
            initialTab={initialTab}
           />;
  }

  return <Dashboard 
            userMode={userMode}
            books={books} 
            onSelectBook={handleSelectBook} 
            onCreateNewBook={handleCreateNewBook}
            onImportBook={handleImportBook}
            onDeleteBook={handleDeleteBook}
            onLogout={handleLogout}
            onGoToLogin={handleGoToLogin}
            onStartGuestSession={handleStartGuestSession}
            onStartKidsGuestSession={handleStartKidsGuestSession}
            isImporting={isImporting}
            mostRecentBook={mostRecentBook}
          />;
};

export default App;
