
import React, { useState, useMemo } from 'react';
import { Reminder } from './types';
import { Card, Modal, DeleteButton } from './components';
import { formatDate } from './utils';

export const RemindersView: React.FC<{
  reminders: Reminder[];
  onAddReminder: (r: Reminder) => void;
  onUpdateReminder: (r: Reminder) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
}> = ({ reminders, onAddReminder, onUpdateReminder, onDeleteReminder, onToggleReminder }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0]
  });

  const stats = useMemo(() => {
    const completed = reminders.filter(r => r.completed).length;
    const remaining = reminders.length - completed;
    return { remaining, completed };
  }, [reminders]);

  // Sorted: Future items first (ascending), then past items (descending - recent overdue first)
  const sortedPending = useMemo(() => 
    reminders.filter(r => !r.completed).sort((a, b) => {
      const isPastA = a.date < todayStr;
      const isPastB = b.date < todayStr;

      if (isPastA && !isPastB) return 1;  
      if (!isPastA && isPastB) return -1; 
      
      if (!isPastA && !isPastB) {
        return a.date.localeCompare(b.date);
      } else {
        return b.date.localeCompare(a.date);
      }
    }),
    [reminders, todayStr]
  );

  const sortedHistory = useMemo(() => 
    reminders.filter(r => r.completed).sort((a, b) => b.date.localeCompare(a.date)),
    [reminders]
  );

  const getRelativeDateInfo = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    // Normalize to midnight for accurate day calculation
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - now.getTime();
    const diffDaysTotal = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const isPast = diffDaysTotal < 0;
    const absDays = Math.abs(diffDaysTotal);
    
    if (absDays === 0) return isPast ? "due today" : "due today";

    const years = Math.floor(absDays / 365);
    const remainingDaysAfterYears = absDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;
    
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    if (days > 0 || (years === 0 && months === 0)) {
      parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }
    
    const label = isPast ? "overdue" : "remaining";
    return `${parts.join(', ')} ${label}`;
  };

  const handleSave = () => {
    if (!formData.title.trim()) return alert("Please enter a task title.");

    const reminderData: Reminder = {
      id: editingReminder?.id || Math.random().toString(36).substr(2, 9),
      title: formData.title,
      date: formData.date,
      priority: editingReminder?.priority || 'medium', // Default priority is medium
      completed: editingReminder?.completed || false
    };

    if (editingReminder) onUpdateReminder(reminderData);
    else onAddReminder(reminderData);

    setIsModalOpen(false);
    setEditingReminder(null);
  };

  const startEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      date: reminder.date
    });
    setIsModalOpen(true);
  };

  const startDelete = (id: string) => {
    setReminderToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (reminderToDelete) {
      onDeleteReminder(reminderToDelete);
      setReminderToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const ReminderItem = ({ reminder }: { reminder: Reminder }) => {
    const relativeInfo = getRelativeDateInfo(reminder.date);
    const isOverdue = !reminder.completed && relativeInfo.includes('overdue');

    return (
      <div className={`group flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all ${reminder.completed ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800 opacity-80' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md'}`}>
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <button 
            onClick={() => onToggleReminder(reminder.id)}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${reminder.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'}`}
          >
            {reminder.completed && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </button>
          <div className="min-w-0 flex-1">
            <h5 className={`font-bold text-xs sm:text-sm truncate ${reminder.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
              {reminder.title}
            </h5>
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatDate(reminder.date)}</span>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isOverdue ? 'text-rose-500 animate-pulse' : reminder.completed ? 'text-emerald-500' : 'text-blue-500'}`}>
                {relativeInfo}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 ml-4">
          <button 
            onClick={() => startEdit(reminder)} 
            className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-100 dark:border-blue-900/20 shadow-sm active:scale-90"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <DeleteButton onClick={() => startDelete(reminder.id)} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-1">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Remaining</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{stats.remaining}</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Task</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-1">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Completed</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{stats.completed}</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Task</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Section */}
        <div className="space-y-4">
          <h4 className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-1 border-l-4 border-blue-600 pl-3">Upcoming Reminders</h4>
          <div className="space-y-3">
            {sortedPending.length > 0 ? (
              sortedPending.map(r => <ReminderItem key={r.id} reminder={r} />)
            ) : (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 italic text-sm">No pending reminders.</p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <h4 className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-1 border-l-4 border-emerald-500 pl-3">Recently Completed</h4>
          <div className="space-y-3">
            {sortedHistory.length > 0 ? (
              sortedHistory.slice(0, 10).map(r => <ReminderItem key={r.id} reminder={r} />)
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <p className="text-slate-400 italic text-sm">No completed tasks yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button 
        className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-light hover:scale-110 active:scale-95 transition-all z-[60] group"
        onClick={() => {
          setEditingReminder(null);
          setFormData({ title: '', date: new Date().toISOString().split('T')[0] });
          setIsModalOpen(true);
        }}
      >
        <span className="group-hover:rotate-90 transition-transform duration-300">+</span>
      </button>

      {/* Input Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingReminder ? "Edit Task" : "Add Task"}>
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Task Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-bold text-sm dark:text-white"
              placeholder="e.g. Call the bank"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Due Date</label>
            <input 
              type="date" 
              value={formData.date} 
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-bold text-sm dark:text-white"
            />
          </div>
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest text-[11px]"
          >
            {editingReminder ? "Update Task" : "Save Task"}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Delete">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </div>
          <p className="font-bold text-slate-800 dark:text-white">Delete this task permanently?</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => setIsDeleteConfirmOpen(false)} className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button onClick={confirmDelete} className="py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-100 dark:shadow-none">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
