
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ManuscriptPart, Book } from '../types';
import { Sparkles } from 'lucide-react';

interface AssistantProps {
  book: Book;
  onUpdateBook: (book: Book) => void;
}

const Assistant: React.FC<AssistantProps> = ({ book, onUpdateBook }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleGenerateBook = async () => {
    if (!prompt) {
      setError('Please enter a prompt for your book.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      setProgress('Generating book outline...');
      const outlineSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
            },
            required: ['title', 'summary']
        }
      };

      const outlineResponse = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `Based on this prompt: "${prompt}", generate a detailed chapter-by-chapter outline for a 20,000-word novel. Provide around 10-12 chapters. For each chapter, provide a title and a 2-3 sentence summary.`,
        config: { responseMimeType: "application/json", responseSchema: outlineSchema },
      });
      
      const outline = JSON.parse(outlineResponse.text) as {title: string, summary: string}[];

      const generatedParts: ManuscriptPart[] = [];
      let previousChapterSummary = "This is the first chapter.";

      for (let i = 0; i < outline.length; i++) {
        const chapterOutline = outline[i];
        setProgress(`Writing Chapter ${i + 1}/${outline.length}: ${chapterOutline.title}`);
        
        const chapterPrompt = `You are a world-class novelist. Write chapter ${i + 1} of a novel titled "${chapterOutline.title}". The overall book prompt is: "${prompt}". This chapter's summary is: "${chapterOutline.summary}". The previous chapter's summary was: "${previousChapterSummary}". Ensure a smooth transition. Write a compelling chapter of approximately 1,500-2,000 words. Output the chapter text directly.`;

        const chapterResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: chapterPrompt
        });

        const chapterContent = chapterResponse.text;
        
        generatedParts.push({
            id: self.crypto.randomUUID(),
            type: 'Chapter',
            title: chapterOutline.title,
            content: chapterContent.trim()
        });
        previousChapterSummary = chapterOutline.summary;
      }

      const updatedBook = {
        ...book,
        manuscriptParts: [
            ...book.manuscriptParts.filter(p => p.type === 'Copyright'), // Keep copyright
            ...generatedParts
        ],
        settings: {
            ...book.settings,
            title: prompt.substring(0, 50)
        }
      };

      onUpdateBook(updatedBook);
      setProgress('Book generation complete!');

    } catch (e) {
      console.error(e);
      setError('An error occurred during generation. Please check the console.');
      setProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center"><Sparkles className="mr-2 text-blue-500" /> AI Book Generator</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-6">Describe your book idea, and the AI assistant will write a manuscript for you.</p>

      <div className="flex flex-col flex-grow">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A science fiction story about a lone botanist on Mars who discovers an ancient alien artifact that could save humanity."
          className="w-full flex-grow p-4 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          rows={8}
          disabled={isLoading}
        />
        <button
          onClick={handleGenerateBook}
          disabled={isLoading}
          className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? `Generating... (${progress})` : 'Generate Book'}
        </button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        {!isLoading && progress && <p className="text-green-500 mt-2 text-sm">{progress}</p>}
      </div>
    </div>
  );
};

export default Assistant;
