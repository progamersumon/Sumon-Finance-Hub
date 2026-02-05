
import React from 'react';
import { Moon, Sun, Search } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, isDarkMode, toggleDarkMode }) => {
  return (
    <header className="h-20 px-6 flex items-center justify-between bg-white border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
        {activeTab.replace('-', ' ')}
      </h2>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="pl-10 pr-4 py-2 bg-slate-100 rounded-full border-none focus:ring-2 focus:ring-blue-500 text-sm w-64 dark:bg-slate-700 dark:text-white"
          />
        </div>
        
        <button 
          onClick={toggleDarkMode}
          className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Md. User</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pro Account</p>
          </div>
          <img 
            src="https://picsum.photos/seed/user123/40/40" 
            alt="Profile" 
            className="w-10 h-10 rounded-xl border-2 border-slate-100 shadow-sm"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
