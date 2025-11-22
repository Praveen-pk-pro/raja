
import React from 'react';
import { UserIcon } from './icons/UserIcon';
import { HeartIcon } from './icons/HeartIcon';

// A simple user object type
interface User {
  username: string;
  role: 'admin' | 'user';
}

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigate: (page: any) => void;
  cartItemCount?: number;
  onOpenCart?: () => void;
  wishlistCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, cartItemCount = 0, onOpenCart, wishlistCount = 0 }) => {
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
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleTitleClick}>
            <div className="bg-gradient-to-br from-purple-600 to-cyan-600 p-1.5 rounded-lg group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white h-6 w-6"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M12 22V12"/></svg>
            </div>
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">ShopDo</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {currentUser && currentUser.role === 'user' && (
               <>
                <button 
                  onClick={() => onNavigate('wishlist')}
                  className="relative p-2 text-slate-300 hover:text-purple-400 transition-colors"
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <HeartIcon className="w-6 h-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-slate-900">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={onOpenCart}
                  className="relative p-2 text-slate-300 hover:text-cyan-400 transition-colors"
                  aria-label="Cart"
                  title="Cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-cyan-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                      {cartItemCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('profile')}
                  className="p-2 text-slate-300 hover:text-white transition-colors flex items-center gap-2"
                  title="Profile"
                >
                   <UserIcon className="w-6 h-6" />
                   <span className="hidden md:inline text-sm font-medium">{currentUser.username}</span>
                </button>
              </>
            )}

            {currentUser ? (
               <button
                onClick={onLogout}
                className="ml-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-md transition-colors"
              >
                Logout
              </button>
            ) : (
                 <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-md hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
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
