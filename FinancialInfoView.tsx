
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Transaction } from './types';
import { ICONS } from './constants';
import { formatDate, getCategoryIcon } from './utils';
import { Card, Modal, DeleteButton } from './components';

export const FinancialInfoView: React.FC<{ 
  transactions: Transaction[]; 
  onAddTransaction: (t: Transaction) => void; 
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (t: Transaction) => void;
  isHistoryOnly?: boolean;
}> = ({ transactions, onAddTransaction, onDeleteTransaction, onUpdateTransaction, isHistoryOnly = false }) => {
  const currentMonthValue = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'Food',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = {
    income: ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other'],
    expense: ['Food', 'Rent', 'Bill', 'DPS', 'Home', 'Transport', 'Shopping', 'Medical', 'Others']
  };

  const months = [
    { label: 'January', value: '01' }, { label: 'February', value: '02' }, { label: 'March', value: '03' },
    { label: 'April', value: '04' }, { label: 'May', value: '05' }, { label: 'June', value: '06' },
    { label: 'July', value: '07' }, { label: 'August', value: '08' }, { label: 'September', value: '09' },
    { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' }
  ];

  const availableYears = useMemo(() => {
    if (transactions.length === 0) {
      return [new Date().getFullYear().toString()];
    }
    const years = transactions.map(t => t.date.split('-')[0]);
    const uniqueYears = Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
    const currentYear = new Date().getFullYear().toString();
    if (!uniqueYears.includes(currentYear)) uniqueYears.push(currentYear);
    return uniqueYears.sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || new Date().getFullYear().toString());
    }
  }, [availableYears, selectedYear]);

  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const dateParts = t.date.split('-');
      const year = dateParts[0];
      const month = dateParts[1];
      if (selectedMonth === 'all') return year === selectedYear;
      return year === selectedYear && month === selectedMonth;
    });
  }, [selectedMonth, selectedYear, transactions]);

  const stats = useMemo(() => {
    const income = filteredData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredData]);

  const breakdownData = useMemo(() => {
    const cats: Record<string, number> = {};
    const expenses = filteredData.filter(t => t.type === 'expense');
    expenses.forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    
    return Object.entries(cats)
      .map(([name, value]) => ({ 
        name, 
        value, 
        percentage: stats.expense > 0 ? (value / stats.expense) * 100 : 0 
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, stats.expense]);

  const yearlyMonthlyData = useMemo(() => {
    if (selectedMonth !== 'all') return [];
    const monthlyMap: Record<string, { month: string, income: number, expense: number }> = {};
    months.forEach(m => { monthlyMap[m.value] = { month: m.label.substring(0, 3), income: 0, expense: 0 }; });
    transactions.filter(t => t.date.startsWith(selectedYear)).forEach(t => {
      const m = t.date.split('-')[1];
      if (monthlyMap[m]) {
        if (t.type === 'income') monthlyMap[m].income += t.amount;
        else monthlyMap[m].expense += t.amount;
      }
    });
    return Object.values(monthlyMap);
  }, [selectedYear, selectedMonth, transactions]);

  const handleSave = () => {
    if (!formData.amount) return alert("Please fill at least the amount field");
    
    const transactionData: Transaction = {
      id: editingTransaction?.id || Math.random().toString(36).substr(2, 9),
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description || ''
    };

    if (editingTransaction) {
      onUpdateTransaction(transactionData);
    } else {
      onAddTransaction(transactionData);
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormData({ ...formData, amount: '', description: '' });
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setFormData({
      type: t.type,
      category: t.category,
      amount: t.amount.toString(),
      description: t.description,
      date: t.date
    });
    setIsModalOpen(true);
  };

  const requestDelete = (t: Transaction) => {
    setTransactionToDelete(t);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete.id);
      setIsDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  const CHART_COLORS = ['#1e3a8a', '#0891b2', '#10b981', '#84cc16', '#581c87', '#ef4444', '#f59e0b', '#d946ef', '#64748b'];

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name, percentage } = props;
    const RADIAN = Math.PI / 180;
    const radiusOutside = outerRadius + 25;
    const xOutside = cx + radiusOutside * Math.cos(-midAngle * RADIAN);
    const yOutside = cy + radiusOutside * Math.sin(-midAngle * RADIAN);
    const radiusInside = innerRadius + (outerRadius - innerRadius) * 0.5;
    const xInside = cx + radiusInside * Math.cos(-midAngle * RADIAN);
    const yInside = cy + radiusInside * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <line x1={cx + outerRadius * Math.cos(-midAngle * RADIAN)} y1={cy + outerRadius * Math.sin(-midAngle * RADIAN)} x2={cx + (outerRadius + 8) * Math.cos(-midAngle * RADIAN)} y2={cy + (outerRadius + 8) * Math.sin(-midAngle * RADIAN)} stroke="#64748b" strokeWidth={1} />
        <text x={xOutside} y={yOutside} fill="#94a3b8" textAnchor={xOutside > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{name}</text>
        <text x={xInside} y={yInside} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-[10px] sm:text-xs">{`${percentage.toFixed(0)}%`}</text>
      </g>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <ICONS.Dashboard className="text-slate-400 w-5 h-5" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter Period:</span>
        </div>
        <div className="flex items-center gap-2 flex-nowrap">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
            <option value="all">All Months</option>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      {!isHistoryOnly && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-500 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden flex justify-between items-center transition-transform hover:-translate-y-1">
              <div><p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Total Income</p><h3 className="text-2xl sm:text-3xl font-black">৳{stats.income.toLocaleString()}</h3></div>
              <div className="bg-white/20 p-2.5 rounded-xl"><ICONS.IncomeArrow className="w-4 h-4 sm:w-5 sm:h-5" /></div>
            </div>
            <div className="bg-rose-500 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden flex justify-between items-center transition-transform hover:-translate-y-1">
              <div><p className="text-rose-100 text-xs font-bold uppercase tracking-wider mb-1">Total Expense</p><h3 className="text-2xl sm:text-3xl font-black">৳{stats.expense.toLocaleString()}</h3></div>
              <div className="bg-white/20 p-2.5 rounded-xl"><ICONS.ExpenseArrow className="w-4 h-4 sm:w-5 sm:h-5" /></div>
            </div>
            <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden flex justify-between items-center transition-transform hover:-translate-y-1">
              <div><p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Balance</p><h3 className="text-2xl sm:text-3xl font-black">৳{stats.balance.toLocaleString()}</h3></div>
              <div className="bg-white/20 p-2.5 rounded-xl"><ICONS.Savings className="w-4 h-4 sm:w-5 sm:h-5" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={selectedMonth === 'all' ? `Monthly Comparison (${selectedYear})` : `Expense Distribution`} className="dark:bg-slate-900 dark:border-slate-800">
              {selectedMonth === 'all' ? (
                 <div className="h-[400px] sm:h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                      <Tooltip 
                        cursor={{fill: '#1e293b', opacity: 0.2}} 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                breakdownData.length > 0 ? (
                  <div className="h-[400px] sm:h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={1} dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                          {breakdownData.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-[400px] flex items-center justify-center text-slate-400 italic">No expenses recorded for this period.</div>
              )}
            </Card>

            <Card title="Expense Breakdown" className="dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-4 max-h-[400px] sm:max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                {breakdownData.length > 0 ? (
                  breakdownData.map((item, idx) => {
                    const catColor = CHART_COLORS[idx % CHART_COLORS.length];
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between items-end text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: `${catColor}15` }}>{getCategoryIcon(item.name, catColor)}</div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">{item.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 font-bold">
                            <span className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm">৳{item.value.toLocaleString()}</span>
                            <span className="text-blue-500 dark:text-blue-400 text-[10px] sm:text-xs">({item.percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden ml-1">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percentage}%`, backgroundColor: catColor }} />
                        </div>
                      </div>
                    );
                  })
                ) : <p className="text-center text-slate-400 py-10 italic">Add transactions to see a breakdown.</p>}
              </div>
            </Card>
          </div>
        </>
      )}

      <Card title={isHistoryOnly ? "Transaction History" : "Recent Transactions"} className="dark:bg-slate-900 dark:border-slate-800">
        <div className="space-y-3">
          {filteredData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(isHistoryOnly ? filteredData : filteredData.slice(0, 10)).sort((a,b) => b.date.localeCompare(a.date)).map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 sm:p-4 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group relative overflow-hidden">
                  <div className="flex items-center space-x-2 sm:space-x-3 relative z-10">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? <ICONS.IncomeArrow className="w-4 h-4 sm:w-5 sm:h-5" /> : <ICONS.ExpenseArrow className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">{t.category}</p>
                      <p className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black">{formatDate(t.date)}{t.description ? ` • ${t.description}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4 relative z-10">
                    <p className={`font-black text-xs sm:text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{t.type === 'income' ? '+' : '-'}৳{t.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button onClick={() => handleEdit(t)} className="p-1.5 sm:p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 sm:bg-white dark:sm:bg-slate-900 hover:bg-blue-100 dark:hover:bg-blue-900/50 sm:border sm:border-blue-100 dark:sm:border-blue-900/50 rounded-lg transition-all" title="Edit">
                        <ICONS.Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <DeleteButton onClick={() => requestDelete(t)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-slate-400 py-10 italic">No transactions found for this period.</p>}
        </div>
      </Card>

      <button className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-light hover:scale-110 active:scale-95 transition-all z-[60] group" onClick={() => { setEditingTransaction(null); setFormData({ type: 'expense', category: 'Food', amount: '', description: '', date: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }}><span className="group-hover:rotate-90 transition-transform duration-300">+</span></button>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} title={editingTransaction ? "Edit Transaction" : "Add Transaction"}>
        <div className="space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500'}`} onClick={() => setFormData({...formData, type: 'expense', category: 'Food'})}>Expense</button>
            <button className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`} onClick={() => setFormData({...formData, type: 'income', category: 'Salary'})}>Income</button>
          </div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm dark:text-white">{categories[formData.type].map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4"><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount (৳)</label><input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm dark:text-white" placeholder="0.00" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm dark:text-white" /></div></div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description (Optional)</label><input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm dark:text-white" placeholder="e.g. Grocery" /></div>
          <button onClick={handleSave} className={`w-full py-3 sm:py-4 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 text-sm ${formData.type === 'income' ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-blue-600 shadow-blue-100 hover:bg-blue-700'}`}>{editingTransaction ? "Update Transaction" : "Save Transaction"}</button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Delete">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </div>
          <p className="text-slate-800 dark:text-white font-bold text-base sm:text-lg">Remove Transaction?</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm px-2">Deleting the {transactionToDelete?.category} transaction for <strong>৳{transactionToDelete?.amount.toLocaleString()}</strong> is permanent.</p>
          <div className="grid grid-cols-2 gap-3 mt-6"><button onClick={() => setIsDeleteConfirmOpen(false)} className="py-2.5 sm:py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm">Cancel</button><button onClick={confirmDelete} className="py-2.5 sm:py-3 px-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 transition-all active:scale-95 text-sm">Delete</button></div>
        </div>
      </Modal>
    </div>
  );
};
