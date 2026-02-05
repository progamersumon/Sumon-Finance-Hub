
import React from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import { Holiday } from '../types';

interface HolidayListProps {
  holidays: Holiday[];
}

const HolidayList: React.FC<HolidayListProps> = ({ holidays }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-rose-500 rounded-full"></div>
          <h3 className="text-xs font-bold text-slate-800 tracking-widest uppercase">PUBLIC HOLIDAY</h3>
        </div>
        <button className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-sm">
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {holidays.map((holiday, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                <Calendar size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{holiday.name}</h4>
                <p className="text-xs text-rose-500 font-medium">{holiday.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                {holiday.daysRemaining} DAYS REMAINING
              </span>
              <button className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolidayList;
