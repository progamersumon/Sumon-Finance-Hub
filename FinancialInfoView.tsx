import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { Transaction } from './types';
import { 
  LayoutGrid, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, Plus, 
  X, Calendar, AlertTriangle, ArrowUp, ArrowDown
} from 'lucide-react';
import { Modal, DeleteButton } from './components';

interface FinancialInfoViewProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  isHistoryOnly?: boolean;
}

const MONTH_OPTIONS = [
  { label: 'January', value: '01' }, { label: 'February', value: '02' }, { label: 'March', value: '03' },
  { label: 'April', value: '04' }, { label: 'May', value: '05' }, { label: 'June', value: '06' },
  { label: 'July', value: '07' }, { label: 'August', value: '08' }, { label: 'September', value: '09' },
  { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' }
];

const IMAGE_THEME_COLORS = ['#1e3a8a', '#0891b2', '#10b981', '#4f46e5', '#7c3aed', '#db2777'];

export const FinancialInfoView: React.FC<FinancialInfoViewProps> = ({ transactions, onAddTransaction, onUpdateTransaction, onDeleteTransaction, isHistoryOnly = false }) => {
  const currentMonthValue = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYearValue = new Date().getFullYear().toString();

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearValue);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'Food',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const categories = {
    income: ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other'],
    expense: ['Food', 'Rent', 'Bill', 'DPS', 'Home', 'Transport', 'Shopping', 'Medical', 'Others']
  };

  const availableYears = useMemo(() => {
    const years = (transactions.map(t => t.date.split('-')[0]) as string[]);
    return Array.from(new Set([...years, currentYearValue])).sort((a, b) => b.localeCompare(a));
  }, [transactions, currentYearValue]);

  const filteredData = useMemo(() => transactions.filter(t => {
      const [year, month] = t.date.split('-');
      return year === selectedYear && (selectedMonth === 'all' || month === selectedMonth);
  }), [selectedMonth, selectedYear, transactions]);

  const stats = useMemo(() => {
    const income = filteredData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredData]);

  const breakdownData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredData.filter(t => t.type === 'expense').forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
    return Object.entries(cats).map(([name, value]) => ({ 
      name, value, percentage: stats.expense > 0 ? (value / stats.expense) * 100 : 0 
    })).sort((a, b) => b.value - a.value);
  }, [filteredData, stats.expense]);

  const monthlyComparisonData = useMemo(() => {
    const monthlyMap: Record<string, { month: string, income: number, expense: number }> = {};
    MONTH_OPTIONS.forEach(m => { monthlyMap[m.value] = { month: m.label.substring(0, 3), income: 0, expense: 0 }; });
    transactions.filter(t => t.date.startsWith(selectedYear)).forEach(t => {
      const m = t.date.split('-')[1];
      if (monthlyMap[m]) {
        if (t.type === 'income') monthlyMap[m].income += t.amount;
        else monthlyMap[m].expense += t.amount;
      }
    });
    return Object.values(monthlyMap);
  }, [selectedYear, transactions]);

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
    const amountVal = parseFloat(formData.amount);
    if (!amountVal || amountVal <= 0) return;
    const data: Transaction = {
      id: editingTransaction?.id || Math.random().toString(36).substr(2, 9),
      type: formData.type,
      category: formData.category,
      amount: amountVal,
      date: formData.date,
      description: formData.description
    };
    if (editingTransaction) onUpdateTransaction(data);
    else onAddTransaction(data);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-300 relative">
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-100 dark:border-slate-800">
          <LayoutGrid size={14} className="text-purple-600" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Data Period</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-white outline-none border border-slate-200 dark:border-slate-700 min-w-[100px]">
            <option value="all">All Months</option>
            {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-white outline-none border border-slate-200 dark:border-slate-700">
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Income', value: stats.income, gradient: 'from-emerald-500 to-teal-600', icon: <ArrowUpCircle size={18} /> },
          { label: 'Total Expense', value: stats.expense, gradient: 'from-rose-500 to-pink-600', icon: <ArrowDownCircle size={18} /> },
          { label: 'Net Balance', value: stats.balance, gradient: 'from-purple-600 to-indigo-700', icon: <Wallet size={18} /> }
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.gradient} p-4 rounded-xl text-white shadow group hover:scale-[1.02] transition-all`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{card.label}</p>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black tracking-tight">৳{card.value.toLocaleString()}</h3>
              <div className="opacity-20 group-hover:opacity-40 transition-opacity">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-[320px]">
          <h3 className="text-[11px] font-black text-purple-600 dark:text-purple-400 -mx-4 -mt-4 mb-4 px-4 py-2.5 bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-800/50 rounded-t-xl flex items-center gap-2 uppercase tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600" /> Performance Insight
          </h3>
          <div className="flex-1 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              {selectedMonth === 'all' ? (
                <BarChart data={monthlyComparisonData} margin={{top: 5, right: 5, left: -20, bottom: 0}}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} barSize={12} />
                  <Bar dataKey="expense" fill="#f43f5e" radius={[2, 2, 0, 0]} barSize={12} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none" labelLine={false} label={renderCustomizedLabel}>
                    {breakdownData.map((_, index) => <Cell key={index} fill={IMAGE_THEME_COLORS[index % IMAGE_THEME_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', border: 'none' }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-[320px]">
          <h3 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 -mx-4 -mt-4 mb-4 px-4 py-2.5 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-800/50 rounded-t-xl flex items-center gap-2 uppercase tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Detailed Breakdown
          </h3>
          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {breakdownData.length > 0 ? breakdownData.map((item, idx) => (
              <div key={item.name} className="border-b border-slate-50 dark:border-slate-800/50 pb-2.5 last:border-0">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: IMAGE_THEME_COLORS[idx % IMAGE_THEME_COLORS.length]}} />
                    <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 uppercase truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="text-[12px] font-black text-slate-900 dark:text-white">৳{item.value.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percentage}%`, backgroundColor: IMAGE_THEME_COLORS[idx % IMAGE_THEME_COLORS.length] }} />
                </div>
              </div>
            )) : <div className="text-center py-16 text-[12px] opacity-20 font-black tracking-widest uppercase">No Data Found</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-[320px]">
          <h3 className="text-[11px] font-black text-orange-600 dark:text-orange-400 -mx-4 -mt-4 mb-4 px-4 py-2.5 bg-orange-50/80 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-800/50 rounded-t-xl flex items-center gap-2 uppercase tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> History
          </h3>
          <div className="space-y-2.5 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {filteredData.length > 0 ? filteredData.sort((a,b) => b.date.localeCompare(a.date)).map(tx => (
              <div key={tx.id} className="p-2.5 rounded-xl border border-slate-50 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-800 transition-all border-l-4" style={{borderLeftColor: tx.type === 'income' ? '#10b981' : '#f43f5e'}}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${tx.type === 'income' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">{tx.type === 'income' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}</div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight leading-none">{tx.category}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1.5">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className={`text-[12px] font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.type === 'income' ? '+' : '-'}৳{tx.amount.toLocaleString()}</p>
                  <div className="flex gap-1">
                    <button onClick={() => { setFormData({ type: tx.type, category: tx.category, amount: tx.amount.toString(), date: tx.date, description: tx.description }); setEditingTransaction(tx); setIsModalOpen(true); }} className="p-1 text-purple-500 hover:bg-purple-50 rounded-lg"><Pencil size={14} /></button>
                    <button onClick={() => { setDeleteId(tx.id); setIsDeleteModalOpen(true); }} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            )) : <div className="text-center py-16 text-[12px] opacity-20 font-black uppercase">Logs Empty</div>}
          </div>
        </div>
      </div>

      <button onClick={() => { setFormData({ type: 'expense', category: 'Food', amount: '', date: new Date().toISOString().split('T')[0], description: '' }); setEditingTransaction(null); setIsModalOpen(true); }} className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl flex items-center justify-center z-40 transition-all hover:scale-110 active:scale-95 group"><Plus size={28} className="group-hover:rotate-90 transition-transform" /></button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}>
        <div className="space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900/80 rounded-full border dark:border-slate-800">
            <button onClick={() => setFormData({...formData, type: 'expense', category: 'Food'})} className={`flex-1 py-1.5 text-[11px] font-black rounded-full transition-all ${formData.type === 'expense' ? 'bg-[#FF0000] text-white' : 'text-slate-400'}`}>Expense</button>
            <button onClick={() => setFormData({...formData, type: 'income', category: 'Salary'})} className={`flex-1 py-1.5 text-[11px] font-black rounded-full transition-all ${formData.type === 'income' ? 'bg-[#10b981] text-white' : 'text-slate-400'}`}>Income</button>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase ml-1">Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-bold dark:text-slate-100 outline-none focus:border-blue-500">
              {categories[formData.type].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase ml-1">Amount (৳)</label>
              <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-bold dark:text-slate-100 outline-none focus:border-blue-500" placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase ml-1">Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-bold dark:text-slate-100 outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase ml-1">Description (Optional)</label>
            <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-bold dark:text-slate-100 outline-none focus:border-blue-500" placeholder="e.g. Grocery" />
          </div>
          <button onClick={handleSave} className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-2xl font-black text-[14px] uppercase tracking-wider">{editingTransaction ? 'Save Changes' : 'Save Transaction'}</button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Removal?">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner"><AlertTriangle size={32} /></div>
          <p className="text-[15px] font-black text-slate-900 dark:text-white uppercase">Confirm Removal?</p>
          <div className="flex gap-3">
            <button onClick={() => { if (deleteId) onDeleteTransaction(deleteId); setIsDeleteModalOpen(false); }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[12px] font-black uppercase">Delete</button>
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl text-[12px] font-black uppercase">Back</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
