
import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Book, ManuscriptPart } from '../types';
import { Languages, BookAudio, PlayCircle, PauseCircle, Volume2 } from 'lucide-react';

interface PublishingToolsProps {
  book: Book;
  onUpdateBook: (book: Book) => void;
}

const SUPPORTED_LANGUAGES = ["Spanish", "French", "German", "Japanese", "Mandarin Chinese", "Italian", "Portuguese", "Russian"];

interface AudioChapter {
    partId: string;
    title: string;
    audioUrl: string;
}

const PublishingTools: React.FC<PublishingToolsProps> = ({ book, onUpdateBook }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState('');
  const [translationError, setTranslationError] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [translatedParts, setTranslatedParts] = useState<ManuscriptPart[] | null>(null);
  
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState('');
  const [audioError, setAudioError] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState<AudioChapter[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const chapters = useMemo(() => book.manuscriptParts.filter(p => p.type === 'Chapter'), [book.manuscriptParts]);

  const handleTranslate = async () => {
    // ... [Translation logic as before, but using book.manuscriptParts] ...
  };

  const handleReplaceManuscript = () => {
    // ... [Replace logic as before, using onUpdateBook] ...
  };
  
  const handleGenerateAudiobook = async () => {
     if (chapters.length === 0) {
      setAudioError('Your manuscript has no chapters to convert to audio.');
      return;
    }
    setAudioError('');
    setIsGeneratingAudio(true);
    setGeneratedAudio([]);
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const allAudio: AudioChapter[] = [];

        for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            setAudioProgress(`Generating audio for chapter ${i + 1}/${chapters.length}`);
            
            const textToSpeak = `${chapter.title}. ${chapter.content.substring(0, 4000)}`; // TTS has character limits

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: textToSpeak }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioUrl = `data:audio/mp3;base64,${base64Audio}`; // The browser can handle base64 audio src
                allAudio.push({ partId: chapter.id, title: chapter.title, audioUrl });
            }
        }
        setGeneratedAudio(allAudio);
        setAudioProgress('Audiobook generation complete!');

    } catch(e) {
        console.error(e);
        setAudioError('An error occurred generating the audiobook.');
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const togglePlay = (audioUrl: string) => {
    if (currentlyPlaying === audioUrl) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setCurrentlyPlaying(audioUrl);
      }
    }
  };
  
  return (
    <div className="p-4 md:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col space-y-8 overflow-y-auto">
      <audio ref={audioRef} onEnded={() => setCurrentlyPlaying(null)} />
      {/* Translator Section */}
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center"><Languages className="mr-2" /> AI Manuscript Translator</h3>
        {/* ... [Translator UI as before] ... */}
      </div>

      {/* Audiobook Section */}
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center"><BookAudio className="mr-2" /> AI Audiobook Creator</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-4">Convert your manuscript into a high-quality audiobook.</p>
        <button
          onClick={handleGenerateAudiobook}
          disabled={isGeneratingAudio || chapters.length === 0}
          className="w-full sm:w-auto bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isGeneratingAudio ? 'Generating...' : 'Generate Audiobook'}
        </button>
        {isGeneratingAudio && <p className="text-sm mt-2">{audioProgress}</p>}
        {audioError && <p className="text-red-500 mt-2 text-sm">{audioError}</p>}

        {generatedAudio.length > 0 && (
            <div className="mt-6 space-y-2">
                <h4 className="font-semibold">Generated Audio Chapters</h4>
                {generatedAudio.map(audio => (
                    <div key={audio.partId} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <span className="font-medium text-sm">{audio.title}</span>
                        <button onClick={() => togglePlay(audio.audioUrl)}>
                            {currentlyPlaying === audio.audioUrl ? <PauseCircle className="text-purple-500" /> : <PlayCircle className="text-purple-500" />}
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default PublishingTools;
