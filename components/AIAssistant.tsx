
import React, { useState } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { getFinancialAdvice } from '../services/gemini';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdvice = async () => {
    setIsLoading(true);
    setAdvice(null);
    
    // Mock data summary to pass to AI
    const summary = `Income: ৳125,000, Expense: ৳45,600, Balance: ৳79,400. 
                     Main savings goal: 30% complete (DPS - PRIME BANK). 
                     Major expense category: Rent (৳20,000).`;
    
    const result = await getFinancialAdvice(summary);
    setAdvice(result || "Could not generate advice.");
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button 
          onClick={() => { setIsOpen(true); fetchAdvice(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center group transition-all duration-300 hover:scale-110"
        >
          <Sparkles className="group-hover:rotate-12 transition-transform" />
        </button>
      ) : (
        <div className="bg-white dark:bg-slate-800 w-80 md:w-96 h-[450px] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
          <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h3 className="font-bold">Financial Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-2xl text-xs font-medium text-slate-600 dark:text-slate-300 max-w-[80%]">
              Hello! I've analyzed your dashboard. Here are some insights:
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-blue-600" />
              </div>
            ) : advice ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {advice}
              </div>
            ) : null}
          </div>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Ask follow up..." 
                className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
              />
              <button className="bg-blue-600 p-2 text-white rounded-xl">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
