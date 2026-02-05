
import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { Reminder } from '../types';

interface ReminderItemProps {
  reminder: Reminder;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder }) => {
  return (
    <div className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-50 transition-colors dark:hover:bg-slate-700/50">
      <div className="flex items-center gap-3">
        {/* Changed status to priority to match Reminder interface */}
        <div className={`p-2 rounded-lg ${
          reminder.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
        } dark:bg-opacity-20`}>
          <Bell size={16} />
        </div>
        <div>
          <h6 className="text-sm font-semibold text-slate-800 dark:text-white">{reminder.title}</h6>
          {/* Changed dueDate to date to match Reminder interface */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due on {reminder.date}</p>
        </div>
      </div>
      <button className="text-slate-300 hover:text-emerald-500 transition-colors">
        <CheckCircle2 size={20} />
      </button>
    </div>
  );
};

export default ReminderItem;
