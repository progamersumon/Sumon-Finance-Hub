
import React from 'react';
import { SavingsGoal } from '../types';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
}

const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-lg font-bold text-slate-800 dark:text-white">{goal.title}</h4>
          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{goal.plan}</p>
        </div>
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          {goal.progress}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl dark:bg-slate-700/50">
          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1">Goal Target</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">৳{goal.target.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl dark:bg-slate-700/50">
          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Maturity Value</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">৳{goal.maturity.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Overall Progress</span>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            {goal.completed} COMPLETE / {goal.total} REMAINING
          </span>
        </div>
        
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-700">
          <div 
            className="h-full bg-blue-600 rounded-full" 
            style={{ width: `${(goal.completed / (goal.completed + goal.total)) * 100}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>COM- {goal.durationCompleted}</span>
          <span>REM- {goal.durationRemaining}</span>
        </div>
      </div>
    </div>
  );
};

export default SavingsGoalCard;
