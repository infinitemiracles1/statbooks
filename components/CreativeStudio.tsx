
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Brush, Image } from 'lucide-react';

interface CreativeStudioProps {
  coloringPages: string[];
  setColoringPages: (pages: string[]) => void;
}

const CreativeStudio: React.FC<CreativeStudioProps> = ({ coloringPages, setColoringPages }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePage = async () => {
    if (!prompt) {
      setError('Please enter a prompt for the coloring page.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Coloring book page, detailed line art, black and white, no shading, clean lines. Style: whimsical and fun. Subject: ${prompt}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      const url = `data:image/jpeg;base64,${base64ImageBytes}`;
      setColoringPages([...coloringPages, url]);
      setPrompt('');

    } catch (e) {
      console.error(e);
      setError('An error occurred while generating the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center"><Brush className="mr-2 text-blue-500" /> Creative Studio</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-6">Generate pages for workbooks, journals, coloring books, and more.</p>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Coloring Book Generator</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-4">Describe a scene or character for a coloring page.</p>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A friendly dragon reading a book"
            className="flex-grow p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleGeneratePage}
            disabled={isLoading || !prompt}
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : 'Add Page'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>

      <div className="mt-6 flex-grow bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-y-auto">
        <h4 className="font-semibold mb-4">Book Pages ({coloringPages.length})</h4>
        {coloringPages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {coloringPages.map((page, index) => (
              <div key={index} className="relative aspect-square border-2 border-gray-300 dark:border-gray-600 rounded-md overflow-hidden shadow">
                <img src={page} alt={`Coloring page ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">{index + 1}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">
            <Image size={48} className="mx-auto mb-2" />
            <p>Your generated coloring pages will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeStudio;
