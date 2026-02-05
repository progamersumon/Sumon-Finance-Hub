
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SummaryData } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

const SummaryCard: React.FC<SummaryData> = ({ title, value, change, type }) => {
  const getColors = () => {
    switch (type) {
      case 'income': return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'expense': return { border: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' };
      default: return { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' };
    }
  };

  const colors = getColors();

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border-t-4 ${colors.border} flex flex-col justify-between h-36`}>
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{title}</span>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          {change > 0 ? <TrendingUp size={10} /> : change < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold text-slate-800 flex items-center gap-1">
          <span className="text-2xl">{CURRENCY_SYMBOL}</span>
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default SummaryCard;
