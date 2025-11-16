
import React from 'react';
import { ExternalLink, BookUser } from 'lucide-react';

const KDPPortal: React.FC = () => {
  const resources = [
    { title: "KDP Royalties Guide", url: "https://kdp.amazon.com/en_US/help/topic/G200644210" },
    { title: "Formatting Guide", url: "https://kdp.amazon.com/en_US/help/topic/G202145400" },
    { title: "Author Central Page Setup", url: "https://author.amazon.com/" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center mb-4">
        <BookUser className="mr-2" /> KDP Onboarding Portal
      </h3>
      
      <div className="aspect-w-16 aspect-h-9 mb-4">
        {/* Replace with a relevant KDP setup tutorial video */}
        <iframe 
          className="w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/d-v5s1bYV_I" 
          title="YouTube video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
      
      <a 
        href="https://kdp.amazon.com/en_US/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center mb-6"
      >
        Go to KDP Sign Up <ExternalLink className="ml-2" size={16} />
      </a>
      
      <div>
        <h4 className="font-semibold mb-2">Business Resources:</h4>
        <ul className="space-y-2">
          {resources.map(res => (
            <li key={res.title}>
              <a 
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center text-sm"
              >
                {res.title} <ExternalLink className="ml-1.5" size={14} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default KDPPortal;
