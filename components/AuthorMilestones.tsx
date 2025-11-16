
import React, { useMemo, useEffect } from 'react';
import { Book } from '../types';
import { Award, Feather, BookCheck, Star } from 'lucide-react';

interface AuthorMilestonesProps {
  book: Book;
  onUpdateBook: (book: Book | ((prevBook: Book) => Book)) => void;
}

const MILESTONES = [
    { id: '1k_words', threshold: 1000, name: 'Budding Author', icon: <Feather />, description: 'Wrote your first 1,000 words.' },
    { id: '5k_words', threshold: 5000, name: 'Story Weaver', icon: <Feather />, description: 'Reached 5,000 words.' },
    { id: '10k_words', threshold: 10000, name: 'Prolific Writer', icon: <Award />, description: 'Reached 10,000 words!' },
    { id: '25k_words', threshold: 25000, name: 'Novelist', icon: <Award />, description: 'Reached 25,000 words!' },
    { id: '5_chapters', threshold: 5, name: 'Chapter Champion', icon: <BookCheck />, description: 'Completed 5 chapters.' },
    { id: '10_chapters', threshold: 10, name: 'Serial Storyteller', icon: <BookCheck />, description: 'Completed 10 chapters.' },
    { id: 'first_book', threshold: 1, name: 'Brave Author', icon: <Star />, description: 'Created your first book project.' },
];

const AuthorMilestones: React.FC<AuthorMilestonesProps> = ({ book, onUpdateBook }) => {
    const wordCount = useMemo(() => {
        return book.manuscriptParts
            .reduce((sum, part) => sum + part.content.split(/\s+/).filter(Boolean).length, 0);
    }, [book.manuscriptParts]);
    
    const chapterCount = useMemo(() => {
        return book.manuscriptParts.filter(p => p.type === 'Chapter').length;
    }, [book.manuscriptParts]);


    useEffect(() => {
        const newlyUnlocked = new Set<string>();

        if (!book.achievements.includes('first_book')) {
            newlyUnlocked.add('first_book');
        }

        MILESTONES.forEach(m => {
            const isUnlocked = book.achievements.includes(m.id);
            if (isUnlocked) return;
            
            if (m.id.includes('_words') && wordCount >= m.threshold) {
                newlyUnlocked.add(m.id);
            } else if (m.id.includes('_chapters') && chapterCount >= m.threshold) {
                newlyUnlocked.add(m.id);
            }
        });
        
        if (newlyUnlocked.size > 0) {
            onUpdateBook(prev => ({
                ...prev,
                achievements: [...prev.achievements, ...Array.from(newlyUnlocked)]
            }));
        }

    }, [wordCount, chapterCount, book.achievements, onUpdateBook]);
    
    const unlockedMilestones = MILESTONES.filter(m => book.achievements.includes(m.id));

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center mb-4">
                <Award className="mr-2" /> Writing Milestones
            </h3>
            <div className="space-y-1 text-sm mb-4">
                <p><strong>Word Count:</strong> {wordCount.toLocaleString()}</p>
                <p><strong>Chapters:</strong> {chapterCount}</p>
            </div>
            <div className="space-y-4">
                {MILESTONES.map(milestone => {
                    const isUnlocked = book.achievements.includes(milestone.id);
                    return (
                        <div key={milestone.id} className={`flex items-center gap-4 p-3 rounded-lg ${isUnlocked ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700 opacity-60'}`}>
                            <div className={`p-2 rounded-full ${isUnlocked ? 'text-green-700 dark:text-green-300' : 'text-gray-500'}`}>
                                {milestone.icon}
                            </div>
                            <div>
                                <h5 className={`font-bold ${isUnlocked ? 'text-green-800 dark:text-green-200' : ''}`}>{milestone.name}</h5>
                                <p className="text-xs">{milestone.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AuthorMilestones;
