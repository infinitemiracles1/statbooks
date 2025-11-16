
import React from 'react';
import { Book, BookTheme } from '../types';
import { Download, Settings, Type } from 'lucide-react';
import { BOOK_THEMES } from '../constants';

interface ExportManagerProps {
  book: Book;
  onUpdateBook: (book: Book) => void;
  onExport: () => void;
  isExporting: boolean;
}

const ExportManager: React.FC<ExportManagerProps> = ({ book, onUpdateBook, onExport, isExporting }) => {
  const { exportSettings } = book;

  const handleSettingsChange = (field: keyof typeof exportSettings, value: any) => {
    const updatedSettings = { ...exportSettings, [field]: value };
    onUpdateBook({ ...book, exportSettings: updatedSettings });
  };
  
  const ThemeCard: React.FC<{theme: BookTheme}> = ({theme}) => (
    <button
        onClick={() => handleSettingsChange('theme', theme)}
        className={`border-2 rounded-lg p-4 text-center transition-colors ${exportSettings.theme === theme ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
    >
        <h4 className="font-bold">{theme}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{theme === 'Classic' ? 'Times New Roman' : (theme === 'Reedsy' ? 'Helvetica' : 'Times Roman')}</p>
    </button>
  );

  return (
    <div className="h-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">Export your book</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Configure your final export options and download your print-ready files.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Settings */}
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold mb-3">Choose a template</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {BOOK_THEMES.map(theme => <ThemeCard key={theme} theme={theme}/>)}
                </div>
            </div>
             <div>
                <h3 className="text-xl font-semibold mb-3">Formatting options</h3>
                <div className="space-y-3">
                    <CheckboxOption 
                        label="Use Drop caps"
                        description="Start each chapter with a large decorative letter."
                        checked={exportSettings.useDropCaps}
                        onChange={(e) => handleSettingsChange('useDropCaps', e.target.checked)}
                    />
                     {/* Add more options like hide chapter numbers etc. here */}
                </div>
            </div>
        </div>

        {/* Right Column: Export Action */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold">Ready to Export?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 text-center">Your book will be exported as a Print-ready PDF.</p>
            <button
                onClick={onExport}
                disabled={isExporting}
                className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center text-lg"
            >
                {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
        </div>
      </div>
    </div>
  );
};

const CheckboxOption: React.FC<{label: string, description: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({label, description, checked, onChange}) => (
    <div className="relative flex items-start">
        <div className="flex h-6 items-center">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
        </div>
        <div className="ml-3 text-sm leading-6">
            <label className="font-medium text-gray-900 dark:text-gray-100">{label}</label>
            <p className="text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    </div>
);

export default ExportManager;
