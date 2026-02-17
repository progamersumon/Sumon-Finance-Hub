import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  Pencil, 
  X,
  Save,
  BellRing,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Eye
} from 'lucide-react';
import { Reminder, LanguageType } from './types';
import { Modal, DeleteButton } from './components';

interface RemindersViewProps {
  language?: LanguageType;
  reminders: Reminder[];
  onAddReminder: (r: Reminder) => void;
  onUpdateReminder: (r: Reminder) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ language = 'en', reminders, onAddReminder, onUpdateReminder, onDeleteReminder, onToggleReminder }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkPreview, setBulkPreview] = useState<Omit<Reminder, 'id' | 'completed'>>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'medium' as 'high' | 'medium' | 'low'
  });

  const t = {
    en: { reminders: 'Active Reminders', add: 'Set Reminder', bulk: 'Bulk Add (Excel)', title: 'Title', date: 'Due Date', priority: 'Priority', save: 'Save Reminder', delConfirm: 'Delete Reminder?', delMsg: 'This action is permanent.', delete: 'Delete', cancel: 'Cancel', bulkTitle: 'Import from Excel', import: 'Import All', preview: 'Import Preview' },
    bn: { reminders: 'সক্রিয় রিমাইন্ডার', add: 'নতুন রিমাইন্ডার', bulk: 'এক্সেলে এড করুন', title: 'শিরোনাম', date: 'শেষ তারিখ', priority: 'গুরুত্ব', save: 'সংরক্ষণ করুন', delConfirm: 'ডিলিট করবেন?', delMsg: 'এটি স্থায়ীভাবে মুছে যাবে।', delete: 'ডিলিট', cancel: 'বাতিল', bulkTitle: 'এক্সেল ইমপোর্ট', import: 'সব এড করুন', preview: 'প্রিভিউ' }
  }[language === 'bn' ? 'bn' : 'en'];

  const toBengaliDigits = (num: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num.toString().replace(/\d/g, (d) => bnDigits[parseInt(d)]);
  };

  const grouped = useMemo(() => ({
    high: reminders.filter(r => r.priority === 'high'),
    medium: reminders.filter(r => r.priority === 'medium'),
    low: reminders.filter(r => r.priority === 'low'),
  }), [reminders]);

  const getDayDiff = (dateStr: string) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(dateStr); target.setHours(0,0,0,0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSave = () => {
    if (!formData.title) return;
    const data: Reminder = { id: editingReminder?.id || Math.random().toString(36).substr(2, 9), ...formData, completed: editingReminder?.completed || false };
    if (editingReminder) onUpdateReminder(data);
    else onAddReminder(data);
    setIsModalOpen(false);
  };

  const handleBulkImport = () => {
    const lines = bulkInput.trim().split('\n');
    lines.forEach(line => {
      const [date, title, priority] = line.split('\t');
      if (date && title) {
        onAddReminder({
          id: Math.random().toString(36).substr(2, 9),
          title: title.trim(),
          date: new Date(date.trim()).toISOString().split('T')[0],
          priority: (priority?.trim().toLowerCase() as any) || 'medium',
          completed: false
        });
      }
    });
    setBulkInput(''); setIsBulkModalOpen(false);
  };

  const ReminderCard: React.FC<{ reminder: Reminder }> = ({ reminder }) => {
    const diff = getDayDiff(reminder.date), overdue = diff < 0, abs = Math.abs(diff);
    return (
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all ${reminder.completed ? 'opacity-60 grayscale' : ''}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => onToggleReminder(reminder.id)} className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${reminder.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200'}`}>
            {reminder.completed && <CheckCircle2 size={18} strokeWidth={3} />}
          </button>
          <div className="flex flex-col min-w-0">
            <h3 className={`text-[14px] font-black text-slate-800 dark:text-slate-200 uppercase truncate max-w-[150px] ${reminder.completed ? 'line-through' : ''}`}>{reminder.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400">{reminder.date}</span>
              {!reminder.completed && <span className={`text-[9px] font-black uppercase tracking-widest ${overdue ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>{language === 'bn' ? toBengaliDigits(abs) : abs} DAYS {overdue ? 'OVERDUE' : 'LEFT'}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!reminder.completed && <button onClick={() => { setEditingReminder(reminder); setFormData({...formData, title: reminder.title, date: reminder.date, priority: reminder.priority}); setIsModalOpen(true); }} className="w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center border hover:border-indigo-500"><Pencil size={15} /></button>}
          <button onClick={() => { setReminderToDelete(reminder.id); setIsDeleteModalOpen(true); }} className="w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center border hover:border-rose-500"><Trash2 size={15} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Bell size={20} /></div>
          <div><h2 className="text-[16px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t.reminders}</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Manage your alerts</p></div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => setIsBulkModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl text-[11px] font-black uppercase border"><FileSpreadsheet size={16} /> {t.bulk}</button>
          <button onClick={() => { setEditingReminder(null); setFormData({title: '', date: new Date().toISOString().split('T')[0], priority: 'medium'}); setIsModalOpen(true); }} className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl"><Plus size={16} /> {t.add}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(['high', 'medium', 'low'] as const).map(p => (
          <section key={p} className="space-y-4">
            <div className="flex items-center gap-3 px-3"><div className={`w-2 h-4 bg-${p === 'high' ? 'rose' : p === 'medium' ? 'amber' : 'blue'}-500 rounded-full`} /><h3 className={`text-[11px] font-black text-${p === 'high' ? 'rose' : p === 'medium' ? 'amber' : 'blue'}-600 uppercase tracking-widest`}>{p} priority</h3></div>
            <div className="flex flex-col gap-3">
              {grouped[p].length > 0 ? grouped[p].map(r => <ReminderCard key={r.id} reminder={r} />) : <div className="py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center"><p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No reminders</p></div>}
            </div>
          </section>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[400px] rounded-[40px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-8"><div className="flex gap-3"><div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><BellRing size={20} /></div><h2 className="text-[18px] font-black text-slate-900 dark:text-white uppercase">{editingReminder ? t.save : t.add}</h2></div><button onClick={() => setIsModalOpen(false)} className="w-11 h-11 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><X size={24} strokeWidth={3} /></button></div>
            <div className="space-y-5">
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.title}</label><input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-12 px-5 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-[13px] font-bold dark:text-white outline-none focus:border-purple-600 shadow-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.date}</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-[12px] font-bold dark:text-white outline-none focus:border-purple-600 shadow-sm" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.priority}</label><select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-[12px] font-bold dark:text-white outline-none focus:border-purple-600 shadow-sm cursor-pointer"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
              </div>
              <button onClick={handleSave} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[13px] uppercase shadow-2xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3"><Save size={20} /> {t.save}</button>
            </div>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[550px] rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6"><div className="flex gap-3"><div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><FileSpreadsheet size={20} /></div><h2 className="text-[18px] font-black text-slate-900 dark:text-white uppercase">{t.bulkTitle}</h2></div><button onClick={() => setIsBulkModalOpen(false)} className="w-11 h-11 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><X size={24} strokeWidth={3} /></button></div>
            <div className="space-y-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 rounded-2xl flex items-start gap-3"><AlertCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" /><p className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 leading-tight uppercase">Format: Column A = Date, Column B = Title, Column C = Priority (optional)</p></div>
              <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="Paste rows from Excel here..." className="w-full h-[140px] px-6 py-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-[32px] text-[13px] font-bold dark:text-white outline-none focus:border-purple-600 transition-all shadow-inner resize-none" />
              <button onClick={handleBulkImport} disabled={!bulkInput.trim()} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-[13px] uppercase shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"><Upload size={20} /> {t.import}</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-[32px] p-8 text-center shadow-2xl border animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertTriangle size={32} /></div>
            <h2 className="text-[18px] font-black text-slate-900 dark:text-white mb-2 uppercase">{t.delConfirm}</h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-8 font-bold leading-relaxed">{t.delMsg}</p>
            <div className="flex gap-4">
              <button onClick={() => { if (reminderToDelete) onDeleteReminder(reminderToDelete); setIsDeleteModalOpen(false); setReminderToDelete(null); }} className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl text-[12px] font-black uppercase hover:bg-rose-700 transition-all">{t.delete}</button>
              <button onClick={() => { setIsDeleteModalOpen(false); setReminderToDelete(null); }} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl text-[12px] font-black uppercase hover:bg-slate-200 transition-all">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
