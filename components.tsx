
import React, { useState } from 'react';
import { ICONS } from './constants';
import { getFinancialAdvice } from './geminiService';
import { ViewType } from './types';

export const DeleteButton: React.FC<{ onClick: () => void, title?: string }> = ({ onClick, title = "Delete" }) => (
  <button 
    onClick={onClick} 
    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-90 transition-all shadow-sm"
    title={title}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  </button>
);

export const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
      </div>
    )}
    <div className="p-4 sm:p-6">
      {children}
    </div>
  </div>
);

export const SidebarItem: React.FC<{ 
  id: ViewType | 'logout', 
  label: string, 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void 
}> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 translate-x-1' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 hover:pl-6'
    }`}
  >
    {!active && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
    )}
    
    <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
      {icon}
    </span>
    <span className="font-medium text-sm lg:text-base whitespace-nowrap">{label}</span>
  </button>
);

export const MetricCard: React.FC<{ metric: any; className?: string }> = ({ metric, className }) => (
  <Card className={`flex-1 border-t-4 border-t-blue-500 dark:bg-slate-900 dark:border-slate-800 ${className}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-widest">{metric.label}</p>
        <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          ৳{metric.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </h4>
      </div>
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-black ${
        metric.trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
      }`}>
        <span>{metric.trend === 'up' ? '↑' : '↓'}</span>
        <span>{Math.abs(metric.change)}%</span>
      </div>
    </div>
  </Card>
);

export const AIAdvisor: React.FC<{ data: any }> = ({ data }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const advice = await getFinancialAdvice(query, data);
    setResponse(advice);
    setLoading(false);
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-xl shadow-blue-100 dark:shadow-indigo-900/20">
      <div className="flex items-center space-x-3 mb-4">
        <ICONS.Bot className="w-6 h-6 animate-bounce" />
        <h3 className="text-lg font-bold">Gemini AI Advisor</h3>
      </div>
      <p className="text-blue-100 text-sm mb-4">Ask me anything about your finances.</p>
      
      {response && (
        <div className="bg-white/10 rounded-lg p-3 mb-4 text-sm leading-relaxed backdrop-blur-md max-h-40 overflow-y-auto border border-white/20 custom-scrollbar">
          {response}
        </div>
      )}

      <div className="flex space-x-2">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something..." 
          className="flex-1 bg-white/20 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-blue-200 focus:ring-2 focus:ring-white outline-none w-full transition-all"
        />
        <button 
          onClick={handleAsk}
          disabled={loading}
          className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-all transform active:scale-95 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </div>
    </Card>
  );
};
