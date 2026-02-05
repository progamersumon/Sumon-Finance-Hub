
import React from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Holiday } from '../types';

interface HolidayCardProps {
  holiday: Holiday;
}

const HolidayCard: React.FC<HolidayCardProps> = ({ holiday }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 dark:bg-rose-900/20">
          <CalendarIcon size={24} />
        </div>
        <div>
          <h5 className="font-bold text-slate-800 dark:text-white leading-tight">{holiday.name}</h5>
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{holiday.date}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            {holiday.daysRemaining} Days Remaining
          </p>
        </div>
        <button className="p-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default HolidayCard;
