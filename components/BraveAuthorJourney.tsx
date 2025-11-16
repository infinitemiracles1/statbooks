
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { HeartHandshake, Lightbulb, Feather } from 'lucide-react';

interface BraveAuthorJourneyProps {
  setManuscript: (updater: (prev: string) => string) => void;
}

const JOURNEY_STEPS = [
  {
    title: "Step 1: Clarify Your Why",
    description: "Every powerful book starts with a clear purpose. Let's uncover the heart of your message.",
    prompts: [
      "What is the core message your soul needs to share with the world?",
      "Who is the one person you are writing this book for? Describe them.",
      "If your reader could only take away one feeling after reading your book, what would it be?",
      "How has your own journey prepared you to write this book?",
    ],
  },
  {
    title: "Step 2: Develop Your Concept",
    description: "Let's shape your message into a tangible book concept. This is where your vision takes form.",
    prompts: [
      "Brainstorm 5 potential titles for your book.",
      "Write a one-paragraph summary of your book, like the one on the back cover.",
      "Is this a memoir, a workbook, a novel, or something else? How will the format serve your message?",
      "What unique perspective do you bring that no one else can?",
    ],
  },
  {
    title: "Step 3: Write From the Heart",
    description: "This is your space to write bravely. Don't worry about perfection; just let your story flow.",
    prompts: [
      "Write the first sentence of your book.",
      "Describe a pivotal moment in your story.",
      "What is a fear you have about writing this? Write about it.",
      "Generate a simple 3-act outline for my story.",
    ],
  },
];

const BraveAuthorJourney: React.FC<BraveAuthorJourneyProps> = ({ setManuscript }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [writingContent, setWritingContent] = useState('');

  const handlePromptClick = async (prompt: string) => {
    setIsLoading(true);
    setAiResponse('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an empathetic and encouraging book writing coach based on the BraveHeart™ Publishing philosophy. Your goal is to help authors transform their personal stories and even pain into a gift for humanity by writing a soul-aligned book. Ask insightful questions, provide gentle guidance, and offer creative exercises to help them uncover their core message and structure their story. Your tone is warm, supportive, and empowering. Keep responses concise and actionable.",
        },
      });
      setAiResponse(response.text);
    } catch (error) {
      console.error("AI prompt failed:", error);
      setAiResponse("Sorry, I couldn't generate a response right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToManuscript = () => {
    if (writingContent.trim()) {
      const contentToAdd = `\n\n<h2>${JOURNEY_STEPS[activeStep].title}</h2>\n\n${writingContent}`;
      setManuscript(prev => prev + contentToAdd);
      setWritingContent('');
      alert('Your writing has been added to the main manuscript!');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
        <HeartHandshake className="mr-2 text-pink-500" /> The Brave Author Journey
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-6">A guided path to writing and publishing a soul-aligned book, step by courageous step.</p>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {JOURNEY_STEPS.map((step, index) => (
          <button
            key={index}
            onClick={() => setActiveStep(index)}
            className={`py-2 px-4 text-sm font-medium transition-colors ${
              activeStep === index
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {step.title}
          </button>
        ))}
      </div>

      <div className="flex-grow overflow-y-auto pr-4">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">{JOURNEY_STEPS[activeStep].title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{JOURNEY_STEPS[activeStep].description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prompts Section */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center"><Lightbulb className="mr-2 text-yellow-400" /> Brave Prompts</h4>
            <div className="space-y-2">
              {JOURNEY_STEPS[activeStep].prompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  disabled={isLoading}
                  className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
            {isLoading && (
               <div className="mt-4 p-4 text-center text-gray-500">Generating guidance...</div>
            )}
            {aiResponse && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-900 border border-blue-200 dark:border-gray-700 rounded-lg">
                <h5 className="font-bold text-blue-800 dark:text-blue-300">AI Writing Coach:</h5>
                <p className="text-sm mt-2 whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </div>

          {/* Writing Section */}
          <div className="flex flex-col">
            <h4 className="font-semibold mb-3 flex items-center"><Feather className="mr-2" /> Your Writing Space</h4>
            <textarea
              value={writingContent}
              onChange={(e) => setWritingContent(e.target.value)}
              placeholder="Use the prompts for inspiration and write your thoughts here..."
              className="w-full flex-grow p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 min-h-[250px]"
            />
            <button
              onClick={handleAddToManuscript}
              disabled={!writingContent.trim()}
              className="mt-2 w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Add to Main Manuscript
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BraveAuthorJourney;
