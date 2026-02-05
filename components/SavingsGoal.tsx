
import React from 'react';
import { SavingsGoal as SavingsGoalType } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

const SavingsGoal: React.FC<SavingsGoalType> = (goal) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* Fix: Property 'name' does not exist on type 'SavingsGoal'. Using 'title' from interface. */}
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">{goal.title}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{goal.plan}</p>
        </div>
        <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-blue-100">
          {goal.progress}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">GOAL TARGET</p>
          <p className="text-lg font-bold text-blue-600">{CURRENCY_SYMBOL}{goal.target.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">MATURITY VALUE</p>
          <p className="text-lg font-bold text-emerald-600">{CURRENCY_SYMBOL}{goal.maturity.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-[10px] font-bold tracking-wider">
          <span className="text-slate-800 uppercase">OVERALL PROGRESS</span>
          <span className="text-blue-600">{goal.completed} COMPLETE / {goal.total} REMAINING</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          {/* Fix: Property 'completedTime' and 'remainingTime' do not exist. Using 'durationCompleted' and 'durationRemaining' from interface. */}
          <span>COM- {goal.durationCompleted}</span>
          <span>REM- {goal.durationRemaining}</span>
        </div>
      </div>
    </div>
  );
};

export default SavingsGoal;
