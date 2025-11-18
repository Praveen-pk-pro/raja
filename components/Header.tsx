import React from 'react';

// A simple user object type
interface User {
  username: string;
  role: 'admin' | 'user';
}

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate }) => {
  const handleTitleClick = () => {
    if (currentUser) {
      onNavigate(currentUser.role === 'admin' ? 'admin-dashboard' : 'user-home');
    } else {
      onNavigate('login');
    }
  }

  return (
    <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleTitleClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 h-7 w-7"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M12 22V12"/></svg>
            <span className="text-xl font-bold text-slate-100">ShopDo</span>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && <span className="text-slate-400 hidden sm:block">Welcome, {currentUser.username} ({currentUser.role})</span>}
            {currentUser ? (
               <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-slate-100 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors"
              >
                Logout
              </button>
            ) : (
                 <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-sm font-medium text-slate-100 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};