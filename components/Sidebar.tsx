
import React from 'react';
import { 
  LayoutDashboard, 
  CircleDollarSign, 
  Users, 
  PiggyBank, 
  ReceiptText, 
  Dices, 
  Bell, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { NavItem } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'financial-info', label: 'Financial Info', icon: <CircleDollarSign size={20} /> },
  { id: 'payroll-info', label: 'Payroll Info', icon: <Users size={20} /> },
  { id: 'savings-info', label: 'Savings Info', icon: <PiggyBank size={20} /> },
  { id: 'bill-info', label: 'Bill Info', icon: <ReceiptText size={20} /> },
  { id: 'betting-info', label: 'Betting Info', icon: <Dices size={20} /> },
  { id: 'reminders', label: 'Reminders', icon: <Bell size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 dark:bg-slate-800 dark:border-slate-700">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
          F
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Finance Hub</h1>
      </div>

      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all dark:text-slate-400 dark:hover:bg-red-900/20">
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
