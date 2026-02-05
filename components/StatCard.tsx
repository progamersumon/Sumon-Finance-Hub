
import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  change: number;
  color: 'green' | 'red' | 'blue';
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, color, icon }) => {
  const colorMap = {
    green: 'border-emerald-500 text-emerald-600 bg-emerald-50',
    red: 'border-rose-500 text-rose-600 bg-rose-50',
    blue: 'border-blue-500 text-blue-600 bg-blue-50',
  };

  const bgMap = {
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border-b-4 ${colorMap[color]} shadow-sm hover:shadow-md transition-shadow duration-300 dark:bg-slate-800 dark:border-opacity-50`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">
          {label}
        </span>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${bgMap[color]}`}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-800 dark:text-white">৳</span>
          <span className="text-3xl font-bold text-slate-800 dark:text-white">
            {value.toLocaleString()}
          </span>
        </div>
        <div className={`p-2 rounded-xl ${bgMap[color]} bg-opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
