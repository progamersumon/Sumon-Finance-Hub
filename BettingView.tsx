import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  Pencil,
  AlertTriangle,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { Bet } from './types';
import { Modal, DeleteButton } from './components';

interface BettingInfoViewProps {
  bets: Bet[];
  onAddBet: (b: Bet) => void;
  onUpdateBet: (b: Bet) => void;
  onDeleteBet: (id: string) => void;
}

const COLORS = { deposit: '#f43f5e', withdraw: '#10b981' };

export const BettingView: React.FC<BettingInfoViewProps> = ({ 
  bets, onAddBet, onUpdateBet, onDeleteBet
}) => {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Bet | null>(null);
  const [editingRecord, setEditingRecord] = useState<Bet | null>(null);

  const [formData, setFormData] = useState({
    status: 'pending' as 'pending' | 'won' | 'lost',
    type: 'deposit' as 'deposit' | 'withdraw',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    event: ''
  });

  const availableYears = useMemo(() => {
    const years = (Array.from(new Set(bets.map(b => b.date.split('-')[0]))) as string[]);
    const current = new Date().getFullYear().toString();
    return Array.from(new Set([...years, current])).sort((a, b) => b.localeCompare(a));
  }, [bets]);

  const stats = useMemo(() => {
    const yearRecords = bets.filter(r => r.date.startsWith(selectedYear));
    const deposits = yearRecords.filter(r => (r.status as any) === 'deposit');
    const withdraws = yearRecords.filter(r => (r.status as any) === 'withdraw');
    const totalD = deposits.reduce((sum, r) => sum + r.amount, 0);
    const totalW = withdraws.reduce((sum, r) => sum + r.amount, 0);
    const distData = [
      { name: 'DEPOSIT', value: totalD, color: COLORS.deposit },
      { name: 'WITHDRAW', value: totalW, color: COLORS.withdraw }
    ].filter(i => i.value > 0);
    return { totalD, totalW, net: totalW - totalD, deposits, withdraws, distData };
  }, [bets, selectedYear]);

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    const midRadius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + midRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + midRadius * Math.sin(-midAngle * RADIAN);
    const sin = Math.sin(-RADIAN * midAngle), cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 2) * cos, sy = cy + (outerRadius + 2) * sin;
    const mx = cx + (outerRadius + 18) * cos, my = cy + (outerRadius + 18) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12, ey = my;
    return (
      <g>
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-black">{`${(percent * 100).toFixed(0)}%`}</text>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#94a3b8" strokeWidth={1.5} fill="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} textAnchor={cos >= 0 ? 'start' : 'end'} fill="#64748b" dominantBaseline="central" className="text-[10px] font-black uppercase tracking-widest">{name}</text>
      </g>
    );
  };

  const handleSave = () => {
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) return;
    const data: Bet = {
      id: editingRecord?.id || Math.random().toString(36).substr(2, 9),
      status: formData.type as any, // In this view type 'deposit'/'withdraw' is mapped to status for storage
      amount: amt,
      date: formData.date,
      event: formData.event || (formData.type === 'deposit' ? 'Deposit' : 'Withdrawal')
    };
    if (editingRecord) onUpdateBet(data);
    else onAddBet(data);
    setIsModalOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-slate-400" />
          <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Filter Year:</span>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-1 text-[13px] font-black text-indigo-600 outline-none">
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-4 rounded-2xl text-white shadow relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12 transition-transform group-hover:scale-110"><ArrowDownCircle size={80} /></div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">Total Deposit</p>
          <h2 className="text-2xl font-black tracking-tight">৳{stats.totalD.toLocaleString()}</h2>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 rounded-2xl text-white shadow relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12 transition-transform group-hover:scale-110"><ArrowUpCircle size={80} /></div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">Total Withdraw</p>
          <h2 className="text-2xl font-black tracking-tight">৳{stats.totalW.toLocaleString()}</h2>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 rounded-2xl text-white shadow relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12 transition-transform group-hover:scale-110"><TrendingUp size={80} /></div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">Net Result</p>
          <h2 className="text-2xl font-black tracking-tight">৳{stats.net.toLocaleString()}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm h-[450px] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50">
            <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2"><PieIcon size={16} className="text-indigo-600" /> Distribution</h3>
          </div>
          <div className="flex-1 p-5">
            {stats.distData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.distData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" labelLine={false} label={renderCustomizedLabel}>
                    {stats.distData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} formatter={(val: number) => `৳${val.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-[11px] font-black text-slate-300 uppercase tracking-widest">No data</div>}
          </div>
        </div>

        {[{ type: 'Deposit', data: stats.deposits, color: 'rose' }, { type: 'Withdraw', data: stats.withdraws, color: 'emerald' }].map(section => (
          <div key={section.type} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[450px] overflow-hidden">
            <div className={`px-5 py-4 border-b border-slate-50 dark:border-slate-800 bg-${section.color}-50/40 dark:bg-${section.color}-900/20`}>
              <h3 className="text-[13px] font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                {section.type === 'Withdraw' ? <ArrowUpCircle size={14} className="text-emerald-600" /> : <ArrowDownCircle size={14} className="text-rose-600" />} {section.type} History
              </h3>
            </div>
            <div className="p-4 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar">
              {section.data.length > 0 ? section.data.sort((a,b) => b.date.localeCompare(a.date)).map(record => (
                <div key={record.id} className={`p-3 bg-${section.color}-50/60 dark:bg-${section.color}-900/30 border border-${section.color}-200/50 dark:border-slate-800/50 rounded-xl flex items-center justify-between group hover:bg-${section.color}-100/80 transition-all shadow-sm`}>
                  <div className="flex flex-col min-w-0 pr-2"><span className="text-[11px] font-black text-slate-900 dark:text-white leading-tight truncate">{formatDate(record.date)}</span><span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">{record.event}</span></div>
                  <div className="flex items-center gap-2 shrink-0"><span className={`text-[12px] font-black text-${section.color}-700 dark:text-${section.color}-400`}>৳{record.amount.toLocaleString()}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setFormData({ status: 'pending', type: record.status as any, amount: record.amount.toString(), date: record.date, event: record.event }); setEditingRecord(record); setIsModalOpen(true); }} className="p-1.5 text-indigo-600 bg-white/80 rounded-lg"><Pencil size={11} /></button>
                      <button onClick={() => { setRecordToDelete(record); setIsDeleteModalOpen(true); }} className="p-1.5 text-rose-600 bg-white/80 rounded-lg"><Trash2 size={11} /></button>
                    </div>
                  </div>
                </div>
              )) : <div className="h-full flex items-center justify-center opacity-30 italic">Empty</div>}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => { setFormData({ status: 'pending', type: 'deposit', amount: '', date: new Date().toISOString().split('T')[0], event: '' }); setEditingRecord(null); setIsModalOpen(true); }} className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-all hover:scale-110 active:scale-95 group"><Plus size={32} className="group-hover:rotate-90 transition-transform" /></button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRecord ? 'Edit Record' : 'Add Record'}>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Type</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
              <button onClick={() => setFormData({...formData, type: 'deposit'})} className={`py-2 text-[11px] font-black uppercase rounded-lg transition-all ${formData.type === 'deposit' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>Deposit</button>
              <button onClick={() => setFormData({...formData, type: 'withdraw'})} className={`py-2 text-[11px] font-black uppercase rounded-lg transition-all ${formData.type === 'withdraw' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>Withdraw</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Amount (৳)</label><input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl text-[14px] font-black dark:text-white outline-none focus:border-indigo-500" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl text-[12px] font-bold dark:text-white outline-none focus:border-indigo-500" /></div>
          </div>
          <button onClick={handleSave} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[14px] uppercase shadow-xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"><Save size={18} /> {editingRecord ? 'Update Record' : 'Save Record'}</button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove Record?">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner"><AlertTriangle size={32} /></div>
          <p className="text-[16px] font-black text-slate-900 dark:text-white uppercase">Remove Record?</p>
          <div className="flex gap-4">
            <button onClick={() => { if (recordToDelete) onDeleteBet(recordToDelete.id); setIsDeleteModalOpen(false); }} className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl text-[12px] font-black uppercase hover:bg-rose-700 transition-all">Delete</button>
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl text-[12px] font-black uppercase hover:bg-slate-200 transition-all">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
