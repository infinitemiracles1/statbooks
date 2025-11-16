
import React from 'react';
import { Book } from '../types';
import KDPPortal from './KDPPortal';
import AuthorMilestones from './AuthorMilestones';

interface AuthorHubProps {
  book: Book;
  onUpdateBook: (book: Book | ((prevBook: Book) => Book)) => void;
}

const AuthorHub: React.FC<AuthorHubProps> = ({ book, onUpdateBook }) => {
  return (
    <div className="h-full overflow-y-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Author Hub</h2>
        <p className="text-gray-600 dark:text-gray-400">Your command center for publishing success and writing motivation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <KDPPortal />
        </div>
        <div>
            <AuthorMilestones book={book} onUpdateBook={onUpdateBook} />
        </div>
      </div>
    </div>
  );
};

export default AuthorHub;
