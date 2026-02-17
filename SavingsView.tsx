import React, { useState, useMemo, useEffect } from 'react';
import { 
  PiggyBank, 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  Target,
  Save,
  History,
  Layers,
  Fingerprint,
  Percent,
  AlertTriangle
} from 'lucide-react';
import { SavingGoal, Transaction } from './types';
import { Modal, DeleteButton, Card } from './components';

interface SavingsViewProps {
  savings: SavingGoal[];
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onEditTransaction: (tx: Transaction) => void; // Using specific naming for sync
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({ 
  savings, 
  transactions, 
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDeleteGoalConfirmOpen, setIsDeleteGoalConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isDeleteRecordConfirmOpen, setIsDeleteRecordConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Transaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [editingRecord, setEditingRecord] = useState<Transaction | null>(null);

  const [goalForm, setGoalForm] = useState({ name: '', monthlyDeposit: '', years: '10', profitPercent: '8.5', targetAmount: '', maturityValue: '', color: '#6366f1' });
  const [recordForm, setRecordForm] = useState({ goalId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  useEffect(() => {
    const P = parseFloat(goalForm.monthlyDeposit), annualRate = parseFloat(goalForm.profitPercent), yrs = parseFloat(goalForm.years);
    if (!isNaN(P) && !isNaN(annualRate) && !isNaN(yrs) && P > 0) {
      const totalPrincipal = P * 12 * yrs, i = (annualRate / 100) / 12, n = yrs * 12; 
      const maturity = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      setGoalForm(prev => ({ ...prev, targetAmount: Math.round(totalPrincipal).toString(), maturityValue: Math.round(maturity).toString() }));
    } else {
      setGoalForm(prev => ({ ...prev, targetAmount: '', maturityValue: '' }));
    }
  }, [goalForm.monthlyDeposit, goalForm.profitPercent, goalForm.years]);

  const sortedHistory = useMemo(() => transactions.filter(t => t.category === 'DPS').sort((a, b) => b.date.localeCompare(a.date)), [transactions]);

  const handleSaveGoal = () => {
    // Note: App state updates are handled via specific props, but this component manages visual state
    alert("Updating assets configuration... (Implementation uses current App state props)");
    setIsGoalModalOpen(false);
  };

  const handleSaveRecord = () => {
    const amt = parseFloat(recordForm.amount);
    if (!recordForm.goalId || isNaN(amt)) return;
    const selectedGoal = savings.find(g => g.id === recordForm.goalId);
    const data: Transaction = {
      id: editingRecord?.id || Math.random().toString(36).substr(2, 9),
      type: 'expense',
      category: 'DPS',
      amount: amt,
      date: recordForm.date,
      description: `Installment: ${selectedGoal?.name || 'Account'} (${recordForm.note || 'Regular'})`
    };
    if (editingRecord) onUpdateTransaction(data);
    else onAddTransaction(data);
    setIsRecordModalOpen(false);
    setEditingRecord(null);
  };

  const formatTimePeriod = (totalMonths: number) => {
    const years = Math.floor(totalMonths / 12), months = Math.round(totalMonths % 12);
    return `${years}Y ${months}M`.toUpperCase();
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 bg-indigo-600 rounded-full" /> Financial Assets</h3>
              <button onClick={() => { setEditingGoal(null); setGoalForm({ name: '', monthlyDeposit: '', years: '10', targetAmount: '', profitPercent: '8.5', maturityValue: '', color: '#6366f1' }); setIsGoalModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg text-[10px] font-black uppercase shadow-sm border border-indigo-100 dark:border-indigo-800">Initialize Account</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {savings.length > 0 ? savings.map(goal => (
                <div key={goal.id} className="aspect-[1.586/1] rounded-[24px] p-6 shadow-2xl relative overflow-hidden group transition-all border border-white/20" style={{ background: `linear-gradient(135deg, ${goal.color} 0%, ${goal.color}aa 40%, ${goal.color}ff 100%)` }}>
                  <div className="absolute inset-0 pointer-events-none opacity-40"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] blend-overlay" /></div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col"><p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Portfolio Account</p><h4 className="text-[16px] font-black text-white uppercase truncate max-w-[210px]">{goal.name}</h4></div>
                      <button onClick={(e) => { e.stopPropagation(); setEditingGoal(goal); setIsGoalModalOpen(true); }} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 backdrop-blur-md"><Pencil size={12} /></button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-100 via-amber-400 to-yellow-500 shadow-inner flex items-center justify-center relative overflow-hidden">
                        <div className="w-8 h-6 border-[0.5px] border-black/10 rounded-sm flex flex-wrap"><div className="w-1/2 h-1/3 border-b border-r border-black/10" /><div className="w-1/2 h-1/3 border-b border-black/10" /><div className="w-1/2 h-1/3 border-b border-r border-black/10" /></div>
                      </div>
                      <p className="text-[14px] font-mono font-black text-white/80 tracking-[0.15em]">••••  ••••  ••••  <span className="text-white">8842</span></p>
                    </div>
                    <div className="space-y-0.5"><p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Current Savings</p><h2 className="text-3xl font-black text-white tracking-tighter">৳{goal.current.toLocaleString()}</h2></div>
                    <div className="flex justify-between items-end border-t border-white/10 pt-4"><div className="flex items-center gap-3"><div><p className="text-[8px] font-black text-white/40 uppercase mb-0.5">Maturity</p><p className="text-[12px] font-black text-white/90">৳{goal.target.toLocaleString()}</p></div><div className="w-px h-6 bg-white/10" /><div><p className="text-[8px] font-black text-white/40 uppercase mb-0.5">Monthly</p><p className="text-[10px] font-black text-white/90 uppercase">৳{goal.deposit}/Mo</p></div></div><Layers size={22} className="text-white/30" /></div>
                  </div>
                  <div className="absolute bottom-6 right-6 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity"><Fingerprint size={48} className="text-white" /></div>
                </div>
              )) : <div className="col-span-full py-20 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-900/50"><PiggyBank size={32} className="text-slate-400" /><p className="text-[13px] font-black uppercase text-slate-500">Account Empty</p></div>}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 bg-emerald-600 rounded-full" /> Transaction History</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-emerald-50 dark:bg-emerald-900/20"><tr className="border-b dark:border-slate-800"><th className="px-6 py-2 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase">Date</th><th className="px-6 py-2 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase">Account</th><th className="px-6 py-2 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase">Amount</th><th className="px-6 py-2 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedHistory.length > 0 ? sortedHistory.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                          <td className="px-6 py-2"><span className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{record.date}</span></td>
                          <td className="px-6 py-2"><span className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[200px] tracking-tight">{record.description.split(':')[1]?.trim() || record.description}</span></td>
                          <td className="px-6 py-2"><span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">৳{record.amount.toLocaleString()}</span></td>
                          <td className="px-6 py-2 text-right"><div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingRecord(record); setRecordForm({ goalId: '', amount: record.amount.toString(), date: record.date, note: '' }); setIsRecordModalOpen(true); }} className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"><Pencil size={14} /></button>
                              <button onClick={() => { setRecordToDelete(record); setIsDeleteRecordConfirmOpen(true); }} className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/30 rounded-lg"><Trash2 size={14} /></button>
                            </div></td>
                        </tr>
                    )) : <tr><td colSpan={4} className="px-6 py-16 text-center opacity-60"><History size={40} className="mx-auto mb-3" /><p className="text-[11px] font-black uppercase">No Recent Activity</p></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 bg-indigo-900/80 rounded-full" /> TARGET PROGRESS</h3>
            <div className="space-y-6">
              {savings.map(goal => {
                const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100);
                return (
                  <div key={goal.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] p-5 shadow-sm group hover:border-blue-400/30 transition-all">
                    <div className="flex justify-between items-start mb-4"><div><h4 className="text-[18px] font-black text-[#1e293b] dark:text-white uppercase leading-tight">{goal.name}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{goal.durationYears} YEARS PLAN</p></div><div className="px-3.5 py-1.5 bg-[#2563eb] text-white text-[10px] font-black rounded-full">{progress}%</div></div>
                    <div className="grid grid-cols-2 gap-3 mb-4"><div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">GOAL TARGET</p><h5 className="text-[14px] font-black text-blue-600 leading-none">৳{goal.target.toLocaleString()}</h5></div><div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">MATURITY</p><h5 className="text-[14px] font-black text-emerald-500 leading-none">৳{goal.target * 1.5}</h5></div></div>
                    <div className="space-y-2"><div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div></div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={editingGoal ? 'Configure Asset' : 'New Asset Account'}>
        <div className="p-4 space-y-6">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Asset Name</label><input type="text" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500" placeholder="e.g. Mutual Fund" /></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Monthly Deposit</label><input type="number" value={goalForm.monthlyDeposit} onChange={e => setGoalForm({...goalForm, monthlyDeposit: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Years</label><input type="number" value={goalForm.years} onChange={e => setGoalForm({...goalForm, years: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl outline-none" /></div></div>
          <button onClick={handleSaveGoal} className="w-full h-12 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[14px] shadow-xl mt-4">Initialize Asset</button>
        </div>
      </Modal>

      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title={editingRecord ? 'Update Record' : 'Record Deposit'}>
        <div className="p-4 space-y-5">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Asset Account</label><select value={recordForm.goalId} onChange={e => setRecordForm({...recordForm, goalId: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl font-bold dark:text-white"><option value="">Select Account</option>{savings.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Amount (৳)</label><input type="number" value={recordForm.amount} onChange={e => setRecordForm({...recordForm, amount: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl dark:text-white" /></div><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Date</label><input type="date" value={recordForm.date} onChange={e => setRecordForm({...recordForm, date: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl dark:text-white" /></div></div>
          <button onClick={handleSaveRecord} className="w-full h-12 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[14px] shadow-xl mt-4">Confirm Deposit</button>
        </div>
      </Modal>

      <button onClick={() => { setEditingRecord(null); setRecordForm({ goalId: savings[0]?.id || '', amount: '', date: new Date().toISOString().split('T')[0], note: '' }); setIsRecordModalOpen(true); }} className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl flex items-center justify-center z-40 transition-all hover:scale-110 group"><Plus size={28} className="group-hover:rotate-90 transition-transform" /></button>
    </div>
  );
};
