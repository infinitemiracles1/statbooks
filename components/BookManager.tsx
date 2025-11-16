
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Book, ManuscriptPart, ManuscriptPartType } from '../types';
import { PlusCircle, GripVertical, FileText, BookHeart, BookKey, Mic, Square } from 'lucide-react';
import CopyrightEditor from './CopyrightEditor';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode } from '../utils/audio';

// Helper function from Gemini Live API guidelines
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


interface BookManagerProps {
  book: Book;
  onUpdateBook: (book: Book | ((prevBook: Book) => Book)) => void;
}

const PART_ICONS: Record<ManuscriptPartType, React.ReactNode> = {
    'Copyright': <BookKey size={16} />,
    'Dedication': <BookHeart size={16} />,
    'Epigraph': <FileText size={16} />,
    'Table of Contents': <FileText size={16} />,
    'Preface': <FileText size={16} />,
    'Part': <FileText size={16} />,
    'Chapter': <FileText size={16} />,
};

const BookManager: React.FC<BookManagerProps> = ({ book, onUpdateBook }) => {
  const [activePartId, setActivePartId] = useState<string | null>(book.manuscriptParts[0]?.id || null);

  // State for voice dictation
  const [isDictating, setIsDictating] = useState(false);
  const [dictationStatus, setDictationStatus] = useState('Click the mic to start dictating.');
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const activePart = book.manuscriptParts.find(p => p.id === activePartId);

  const stopDictation = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    setIsDictating(false);
    setDictationStatus('Dictation stopped.');
  }, []);

  const startDictation = useCallback(async () => {
    if (isDictating || !activePartId) return;
    setIsDictating(true);
    setDictationStatus('Connecting...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setDictationStatus('Connected. Start speaking...');
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioEvent) => {
              const inputData = audioEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription && activePartId) {
              const textChunk = message.serverContent.inputTranscription.text;
              onUpdateBook(prevBook => {
                const updatedParts = prevBook.manuscriptParts.map(p => 
                    p.id === activePartId ? { ...p, content: p.content + textChunk } : p
                );
                return { ...prevBook, manuscriptParts: updatedParts };
              });
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setDictationStatus(`Error: ${e.message}`);
            stopDictation();
          },
          onclose: () => {
             setDictationStatus('Connection closed.');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
        },
      });
    } catch (error) {
      console.error('Failed to start dictation:', error);
      setDictationStatus('Mic access denied?');
      setIsDictating(false);
    }
  }, [isDictating, activePartId, onUpdateBook, stopDictation]);
  
  useEffect(() => {
    return () => {
      stopDictation();
    };
  }, [stopDictation]);


  const handleUpdatePart = (partId: string, newContent: Partial<ManuscriptPart>) => {
    const updatedParts = book.manuscriptParts.map(p => 
      p.id === partId ? { ...p, ...newContent } : p
    );
    onUpdateBook({ ...book, manuscriptParts: updatedParts });
  };
  
  const handleAddPart = (type: ManuscriptPartType) => {
      const newPart: ManuscriptPart = {
          id: self.crypto.randomUUID(),
          type,
          title: type === 'Chapter' ? `Chapter ${book.manuscriptParts.filter(p=>p.type === 'Chapter').length + 1}` : `New ${type}`,
          content: ''
      };
      const updatedParts = [...book.manuscriptParts, newPart];
      onUpdateBook({ ...book, manuscriptParts: updatedParts });
      setActivePartId(newPart.id);
  };

  const PartEditor: React.FC<{ part: ManuscriptPart }> = ({ part }) => (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between">
            <input 
                type="text"
                value={part.title}
                onChange={(e) => handleUpdatePart(part.id, { title: e.target.value })}
                className="text-3xl font-bold bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none p-2 mb-4 flex-grow"
                disabled={part.type === 'Copyright'}
            />
             <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">{dictationStatus}</span>
                <button
                    onClick={isDictating ? stopDictation : startDictation}
                    className={`p-2 rounded-full transition-colors ${isDictating ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isDictating ? 'Stop Dictation' : 'Start Dictation'}
                    disabled={!activePartId || activePart?.type === 'Copyright'}
                >
                    {isDictating ? <Square size={20} /> : <Mic size={20} />}
                </button>
             </div>
        </div>
        <textarea
          value={part.content}
          onChange={(e) => handleUpdatePart(part.id, { content: e.target.value })}
          className="w-full flex-grow p-4 bg-white dark:bg-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
    </div>
  );

  return (
    <div className="flex h-full gap-8">
      {/* Sidebar */}
      <div className="w-1/4 h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Manuscript</h2>
        <div className="flex-grow overflow-y-auto pr-2">
            {book.manuscriptParts.map(part => (
                <button 
                    key={part.id}
                    onClick={() => setActivePartId(part.id)}
                    className={`w-full text-left p-2 rounded-md flex items-center group ${activePartId === part.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    <span className="mr-2 text-gray-500">{PART_ICONS[part.type]}</span>
                    <span className="flex-grow truncate">{part.title}</span>
                    <GripVertical size={16} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                </button>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
             <button onClick={() => handleAddPart('Chapter')} className="w-full flex items-center justify-center p-2 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900">
                <PlusCircle size={18} className="mr-2"/> Add Chapter
             </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-3/4 h-full">
        {activePart ? (
          activePart.type === 'Copyright' ? 
          <CopyrightEditor book={book} onUpdateBook={onUpdateBook} /> 
          : <PartEditor part={activePart} />
        ) : (
          <div className="text-center p-10">Select a part to start editing.</div>
        )}
      </div>
    </div>
  );
};

export default BookManager;
