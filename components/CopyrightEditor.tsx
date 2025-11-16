
import React from 'react';
import { Book, CopyrightSettings } from '../types';

interface CopyrightEditorProps {
    book: Book;
    onUpdateBook: (book: Book) => void;
}

const CopyrightEditor: React.FC<CopyrightEditorProps> = ({ book, onUpdateBook }) => {

    const handleChange = (field: keyof CopyrightSettings, value: any) => {
        const updatedCopyright = { ...book.copyright, [field]: value };
        onUpdateBook({ ...book, copyright: updatedCopyright });
    };
    
    const handleClauseChange = (clause: keyof CopyrightSettings['clauses'], value: boolean) => {
        const updatedClauses = { ...book.copyright.clauses, [clause]: value };
        handleChange('clauses', updatedClauses);
    };
    
    const handleIsbnChange = (type: keyof CopyrightSettings['isbns'], value: string) => {
        const updatedIsbns = { ...book.copyright.isbns, [type]: value };
        handleChange('isbns', updatedIsbns);
    }
    
    return (
        <div className="h-full overflow-y-auto pr-4">
            <h2 className="text-3xl font-bold mb-4">Copyright</h2>
            <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Book Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingInput label="Pen name" value={book.copyright.penName} onChange={(e) => handleChange('penName', e.target.value)} placeholder={book.settings.author}/>
                    <SettingSelect label="Edition" value={book.copyright.edition} onChange={(e) => handleChange('edition', e.target.value)} options={['First edition', 'Second edition', 'Third edition']} />
                    <SettingInput label="Year of publication" value={book.copyright.year} onChange={(e) => handleChange('year', e.target.value)} />
                </div>

                <h3 className="text-lg font-semibold border-b pb-2">ISBNs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingInput label="EPUB" value={book.copyright.isbns.epub} onChange={(e) => handleIsbnChange('epub', e.target.value)} />
                    <SettingInput label="Kindle" value={book.copyright.isbns.kindle} onChange={(e) => handleIsbnChange('kindle', e.target.value)} />
                    <SettingInput label="Paperback" value={book.copyright.isbns.paperback} onChange={(e) => handleIsbnChange('paperback', e.target.value)} />
                    <SettingInput label="Hardcover" value={book.copyright.isbns.hardcover} onChange={(e) => handleIsbnChange('hardcover', e.target.value)} />
                </div>
                
                 <h3 className="text-lg font-semibold border-b pb-2">Publisher</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingInput label="Publisher name" value={book.copyright.publisherName} onChange={(e) => handleChange('publisherName', e.target.value)} />
                    {/* Publisher logo upload would be here */}
                </div>

                <h3 className="text-lg font-semibold border-b pb-2">Clauses</h3>
                <div className="space-y-3">
                    <ClauseCheckbox label="All rights reserved" checked={book.copyright.clauses.allRightsReserved} onChange={(e) => handleClauseChange('allRightsReserved', e.target.checked)} />
                    <ClauseCheckbox label="Fiction" checked={book.copyright.clauses.fiction} onChange={(e) => handleClauseChange('fiction', e.target.checked)} />
                    <ClauseCheckbox label="Moral rights" checked={book.copyright.clauses.moralRights} onChange={(e) => handleClauseChange('moralRights', e.target.checked)} />
                    <ClauseCheckbox label="External content" checked={book.copyright.clauses.externalContent} onChange={(e) => handleClauseChange('externalContent', e.target.checked)} />
                    <ClauseCheckbox label="Designations" checked={book.copyright.clauses.designations} onChange={(e) => handleClauseChange('designations', e.target.checked)} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional clauses</label>
                        <textarea value={book.copyright.clauses.custom} onChange={(e) => handleClauseChange('custom', e.target.value)} rows={3} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                    </div>
                </div>
                 <p className="text-xs text-gray-500 dark:text-gray-400">Your book will include a credit to Typesetter AI for interior design.</p>
            </div>
        </div>
    );
};

const SettingInput: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
    </div>
);
const SettingSelect: React.FC<any> = ({ label, options, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <select {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const ClauseCheckbox: React.FC<any> = ({ label, ...props }) => (
    <label className="flex items-center space-x-3">
        <input type="checkbox" {...props} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
);


export default CopyrightEditor;
