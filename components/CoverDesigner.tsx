
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Image, Calculator, ChevronDown } from 'lucide-react';
import { BookSettings } from '../types';

interface CoverDesignerProps {
  manuscript: string;
  bookSettings: BookSettings;
}

const CoverDesigner: React.FC<CoverDesignerProps> = ({ manuscript, bookSettings }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  // KDP Calculator state
  const [pageCount, setPageCount] = useState('');
  const [paperType, setPaperType] = useState<'white' | 'cream'>('white');
  const [coverDimensions, setCoverDimensions] = useState<{
    widthIn: number; heightIn: number; widthPx: number; heightPx: number; spineIn: number;
  } | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  useEffect(() => {
    // Estimate page count when manuscript changes
    const words = manuscript.split(/\s+/).filter(Boolean).length;
    // A common estimate is 250-300 words per page. We'll use 275.
    const estimatedPages = Math.ceil(words / 275);
    setPageCount(estimatedPages > 0 ? String(estimatedPages) : '100');
  }, [manuscript]);
  
  const handleCalculateCoverSize = () => {
    const bleed = 0.125; // inches
    const trimWidth = bookSettings.trimSize.widthInches;
    const trimHeight = bookSettings.trimSize.heightInches;
    const pages = parseInt(pageCount, 10);
    
    if (isNaN(pages) || pages <= 0) {
      alert("Please enter a valid page count.");
      return;
    }

    const spineIn = paperType === 'white' 
      ? pages * 0.002252 
      : pages * 0.0025;

    const widthIn = (bleed * 2) + (trimWidth * 2) + spineIn;
    const heightIn = (bleed * 2) + trimHeight;

    setCoverDimensions({
      widthIn: parseFloat(widthIn.toFixed(3)),
      heightIn: parseFloat(heightIn.toFixed(3)),
      widthPx: Math.round(widthIn * 300),
      heightPx: Math.round(heightIn * 300),
      spineIn: parseFloat(spineIn.toFixed(3)),
    });
  };

  const handleGenerateCover = async () => {
    if (!prompt) {
      setError('Please enter a prompt for your cover design.');
      return;
    }
    setError('');
    setIsLoading(true);
    setImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Book cover art, professional illustration, no text. Prompt: ${prompt}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '9:16', // Portrait for book covers
        },
      });

      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      const url = `data:image/jpeg;base64,${base64ImageBytes}`;
      setImageUrl(url);

    } catch (e) {
      console.error(e);
      setError('An error occurred while generating the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Cover Designer</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-6">Describe your book cover, and let AI create a stunning visual concept for you.</p>
      
      <div className="flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., An epic fantasy landscape with a lone castle on a mountain, silhouetted against a dragon-filled sky."
          className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={handleGenerateCover}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Generating...' : 'Generate Cover'}
        </button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>

      <div className="mt-6 flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4 min-h-[300px]">
        {isLoading && <div className="text-gray-500">Generating your cover...</div>}
        {!isLoading && imageUrl && <img src={imageUrl} alt="Generated book cover" className="max-h-full max-w-full object-contain rounded-md shadow-lg" />}
        {!isLoading && !imageUrl && (
          <div className="text-center text-gray-500">
            <Image size={48} className="mx-auto mb-2" />
            <p>Your generated cover will appear here.</p>
          </div>
        )}
      </div>

      {/* KDP Calculator */}
      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
        <button onClick={() => setIsCalculatorOpen(!isCalculatorOpen)} className="w-full flex justify-between items-center text-left">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center"><Calculator className="mr-2"/> KDP Cover Calculator</h3>
          <ChevronDown className={`transition-transform ${isCalculatorOpen ? 'rotate-180' : ''}`} />
        </button>
        {isCalculatorOpen && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Calculate the exact dimensions for your KDP print cover file.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trim Size</label>
                <input type="text" value={bookSettings.trimSize.name} readOnly className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Count (est.)</label>
                <input type="number" value={pageCount} onChange={(e) => setPageCount(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paper Type</label>
                <select value={paperType} onChange={(e) => setPaperType(e.target.value as 'white' | 'cream')} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <option value="white">White</option>
                  <option value="cream">Cream</option>
                </select>
              </div>
            </div>
            <button onClick={handleCalculateCoverSize} className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Calculate Dimensions</button>
            {coverDimensions && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <h4 className="font-bold">Required Cover Dimensions:</h4>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li><span className="font-semibold">Spine Width:</span> {coverDimensions.spineIn} inches</li>
                  <li><span className="font-semibold">Full Width:</span> {coverDimensions.widthIn} inches ({coverDimensions.widthPx} pixels)</li>
                  <li><span className="font-semibold">Height:</span> {coverDimensions.heightIn} inches ({coverDimensions.heightPx} pixels)</li>
                </ul>
                <p className="text-xs mt-2 text-gray-500">Dimensions include a 0.125" bleed. Resolution: 300 DPI.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverDesigner;
