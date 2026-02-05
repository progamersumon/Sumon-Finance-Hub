
import React, { useState, useMemo, useEffect } from 'react';
import { SavingGoal, Transaction } from './types';
import { Card, Modal, DeleteButton } from './components';
import { SavingsPlan } from './App';

export const SavingsView: React.FC<{ 
  savings: SavingGoal[];
  transactions: Transaction[];
  savingsPlan: SavingsPlan;
  onUpdatePlan: (p: SavingsPlan) => void;
  onAddTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteTransactions: (ids: string[]) => void;
  onUpdateTransaction: (t: Transaction) => void;
}> = ({ 
  savings, transactions, savingsPlan, onUpdatePlan, 
  onAddTransaction, onDeleteTransaction, onDeleteTransactions, onUpdateTransaction 
}) => {
  // Calculator/Edit Modal local form states
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAddDPSOpen, setIsAddDPSOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Local form for Settings Modal (to prevent instant sync while typing)
  const [modalBankName, setModalBankName] = useState(savingsPlan.bankName);
  const [modalYears, setModalYears] = useState(savingsPlan.years.toString());
  const [modalRate, setModalRate] = useState(savingsPlan.rate.toString());
  const [modalAmount, setModalAmount] = useState(savingsPlan.amount.toString());

  const now = new Date();
  const [dpsAmount, setDpsAmount] = useState(savingsPlan.amount.toString());
  const [dpsMonth, setDpsMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
  const [dpsYear, setDpsYear] = useState(now.getFullYear().toString());

  // Sync modal form with global state when modal opens
  useEffect(() => {
    if (isCalculatorOpen) {
      setModalBankName(savingsPlan.bankName);
      setModalYears(savingsPlan.years.toString());
      setModalRate(savingsPlan.rate.toString());
      setModalAmount(savingsPlan.amount.toString());
    }
  }, [isCalculatorOpen, savingsPlan]);

  const monthOptions = [
    { label: 'January', value: '01' }, { label: 'February', value: '02' }, { label: 'March', value: '03' },
    { label: 'April', value: '04' }, { label: 'May', value: '05' }, { label: 'June', value: '06' },
    { label: 'July', value: '07' }, { label: 'August', value: '08' }, { label: 'September', value: '09' },
    { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' }
  ];

  const handleUpdateSim = () => {
    onUpdatePlan({
      bankName: modalBankName || 'DPS - Savings',
      years: parseInt(modalYears) || 10,
      rate: parseFloat(modalRate) || 7.5,
      amount: parseInt(modalAmount) || 5000
    });
    setIsCalculatorOpen(false);
  };

  const handleSaveDPS = () => {
    const amountVal = parseFloat(dpsAmount);
    if (isNaN(amountVal) || amountVal <= 0) return alert("Please enter a valid amount.");
    
    const yearVal = parseInt(dpsYear);
    if (isNaN(yearVal) || yearVal < 1900 || yearVal > 2100) return alert("Please enter a valid year (1900-2100).");

    const targetDate = `${dpsYear}-${dpsMonth}-01`;

    const isDuplicate = transactions.some(t => 
      t.category === 'DPS' && 
      t.date === targetDate && 
      t.id !== editingTransaction?.id
    );

    if (isDuplicate) {
      const monthLabel = monthOptions.find(m => m.value === dpsMonth)?.label;
      return alert(`Warning: A DPS entry for ${monthLabel} ${dpsYear} already exists!`);
    }

    const transactionData: Transaction = {
      id: editingTransaction?.id || Math.random().toString(36).substr(2, 9),
      type: 'expense',
      category: 'DPS',
      amount: amountVal,
      date: targetDate,
      description: savingsPlan.bankName
    };

    if (editingTransaction) {
      onUpdateTransaction(transactionData);
    } else {
      onAddTransaction(transactionData);
    }
    
    setIsAddDPSOpen(false);
    setEditingTransaction(null);
  };

  const startDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleClearAll = () => {
    const dpsIds = transactions
      .filter(t => t.category === 'DPS')
      .map(t => t.id);
    
    if (dpsIds.length === 0) {
      alert("No DPS records found to delete.");
      setIsDeleteAllOpen(false);
      return;
    }

    onDeleteTransactions(dpsIds);
    setIsDeleteAllOpen(false);
  };

  const startEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDpsAmount(transaction.amount.toString());
    const dateParts = transaction.date.split('-');
    setDpsYear(dateParts[0]);
    setDpsMonth(dateParts[1]);
    setIsAddDPSOpen(true);
  };

  const monthlyLogData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dpsTransactions = transactions
      .filter(t => t.category === 'DPS' && t.type === 'expense')
      .sort((a, b) => a.date.localeCompare(b.date));

    if (dpsTransactions.length === 0) return [];

    const firstDate = new Date(dpsTransactions[0].date);
    const lastDate = new Date(dpsTransactions[dpsTransactions.length - 1].date);
    
    const results = [];
    let currentGTotal = 0;
    const startYear = firstDate.getFullYear();
    const startMonth = firstDate.getMonth();
    const endYear = lastDate.getFullYear();
    const endMonth = lastDate.getMonth();
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

    for (let i = 0; i < totalMonths; i++) {
      const currentIdx = startMonth + i;
      const yearOffset = Math.floor(currentIdx / 12);
      const year = startYear + yearOffset;
      const monthIdx = currentIdx % 12;
      const monthKey = `${year}-${(monthIdx + 1).toString().padStart(2, '0')}`;
      
      const monthTransactions = dpsTransactions.filter(t => t.date.startsWith(monthKey));
      const monthlyDeposit = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyProfit = i === 0 ? 0 : Math.round(currentGTotal * ((savingsPlan.rate / 100) / 12));
      currentGTotal += monthlyDeposit + monthlyProfit;

      if (monthlyDeposit > 0) {
        results.push({
          month: `${monthNames[monthIdx]}-${year.toString().slice(-2)}`,
          deposit: monthlyDeposit,
          profit: monthlyProfit,
          gTotal: currentGTotal,
          originalTransaction: monthTransactions[0]
        });
      }
    }
    return results.reverse();
  }, [transactions, savingsPlan.rate]);

  const { actualStats, planStats } = useMemo(() => {
    const newest = monthlyLogData[0];
    const totalDeposit = monthlyLogData.reduce((sum, row) => sum + row.deposit, 0);
    const current = newest?.gTotal || 0;
    const profit = current - totalDeposit;
    const completedMonths = monthlyLogData.length;

    const n = savingsPlan.years * 12; 
    const i = (savingsPlan.rate / 100) / 12; 
    const p = savingsPlan.amount; 
    
    const plannedPrincipal = p * n;
    const plannedMaturity = Math.round(p * (((Math.pow(1 + i, n) - 1) / i) * (1 + i)));

    const remainingMonths = Math.max(0, n - completedMonths);
    const comYears = Math.floor(completedMonths / 12);
    const comMonths = completedMonths % 12;
    const remYears = Math.floor(remainingMonths / 12);
    const remMonths = remainingMonths % 12;

    return { 
      actualStats: { current, totalDeposit, profit, completedMonths, comYears, comMonths },
      planStats: { plannedPrincipal, plannedMaturity, totalMonths: n, remainingMonths, remYears, remMonths }
    };
  }, [monthlyLogData, savingsPlan]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 lg:pb-0 relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-8 border-l-blue-600 transition-transform hover:-translate-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL DEPOSIT (ACTUAL)</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">৳{actualStats.totalDeposit.toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-8 border-l-emerald-500 transition-transform hover:-translate-y-1">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">EARNED PROFIT</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">৳{actualStats.profit.toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-8 border-l-indigo-400 transition-transform hover:-translate-y-1">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">CURRENT VALUE</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">৳{actualStats.current.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-1 border-l-4 border-blue-600 pl-3">Savings Goals Progress</h4>
          <Card className="relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-black text-slate-800 dark:text-white text-lg sm:text-xl tracking-tight uppercase">{savingsPlan.bankName}</h5>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{savingsPlan.years} YEARS PLAN • GOAL TARGETED</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                  {planStats.plannedMaturity > 0 ? Math.round((actualStats.current / planStats.plannedMaturity) * 100) : 0}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">GOAL TARGET</p>
                  <p className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 uppercase whitespace-nowrap">
                    ৳{planStats.plannedPrincipal.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">MATURITY VALUE</p>
                  <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase whitespace-nowrap">
                    ৳{planStats.plannedMaturity.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <span>Overall Progress</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black">
                    {actualStats.completedMonths} Complete / {planStats.remainingMonths} Remaining
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm bg-blue-600"
                    style={{ width: `${Math.min(100, planStats.plannedMaturity > 0 ? (actualStats.current / planStats.plannedMaturity) * 100 : 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  <span>Com- {actualStats.comYears} Years {actualStats.comMonths} Month</span>
                  <span>Rem- {planStats.remYears} Years {planStats.remMonths} Month</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 px-1 border-l-4 border-indigo-600 pl-3">
             <div className="flex items-center gap-2">
               <h4 className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm uppercase tracking-[0.2em]">MONTHLY SAVINGS LOG</h4>
               <div className="flex items-center gap-2 ml-2">
                 <button 
                  onClick={() => setIsCalculatorOpen(true)} 
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90" 
                  title="Plan Settings"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                 </button>
                 <button 
                  onClick={() => setIsDeleteAllOpen(true)} 
                  className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-400 dark:text-rose-500 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-90" 
                  title="Delete All DPS Records"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                 </button>
               </div>
             </div>
          </div>

          <Card className="p-0 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col dark:bg-slate-900">
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              {monthlyLogData.length > 0 ? (
                <table className="w-full text-left border-collapse table-fixed min-w-[320px]">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr className="border-b border-slate-100 dark:border-slate-800 shadow-sm">
                      <th className="px-2 sm:px-6 py-3 text-[9px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[20%]">MONTH</th>
                      <th className="px-2 sm:px-6 py-3 text-[9px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[22%]">DEPOSIT</th>
                      <th className="px-2 sm:px-6 py-3 text-[9px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[18%]">PROFIT</th>
                      <th className="px-2 sm:px-6 py-3 text-[9px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[22%]">TOTAL</th>
                      <th className="px-2 sm:px-6 py-3 text-[9px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[18%] text-right">ACT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {monthlyLogData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors bg-white dark:bg-slate-900">
                        <td className="px-2 sm:px-6 py-2.5">
                          <span className="font-bold text-slate-800 dark:text-white text-[10px] sm:text-sm">{row.month}</span>
                        </td>
                        <td className="px-2 sm:px-6 py-2.5">
                          <span className="font-black text-blue-700 dark:text-blue-400 text-[10px] sm:text-sm">৳{row.deposit.toLocaleString()}</span>
                        </td>
                        <td className="px-2 sm:px-6 py-2.5">
                          <span className={`font-black text-[9px] sm:text-sm ${row.profit > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>
                            {row.profit > 0 ? `৳${row.profit.toLocaleString()}` : '৳0'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-6 py-2.5">
                          <span className="font-black text-slate-900 dark:text-slate-200 text-[10px] sm:text-sm">৳{row.gTotal.toLocaleString()}</span>
                        </td>
                        <td className="px-2 sm:px-6 py-2.5 text-right">
                          <div className="flex justify-end items-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => startEditTransaction(row.originalTransaction)} 
                              className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all shadow-sm active:scale-90" 
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <DeleteButton onClick={() => startDeleteTransaction(row.originalTransaction.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg></div>
                  <h5 className="font-bold text-slate-400 dark:text-slate-600 text-sm uppercase tracking-widest">No Installments Recorded</h5>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} title="Goal & Plan Settings">
        <div className="space-y-5">
           <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Name</label>
             <input type="text" value={modalBankName} onChange={(e) => setModalBankName(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-sm text-slate-700 dark:text-white" />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Goal Duration (Y)</label>
               <input type="number" value={modalYears} onChange={(e) => setModalYears(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-sm dark:text-white" />
             </div>
             <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Interest Rate (%)</label>
               <input type="number" step="0.01" value={modalRate} onChange={(e) => setModalRate(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-sm dark:text-white" />
             </div>
           </div>
           <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Standard Deposit (৳)</label>
             <input type="number" value={modalAmount} onChange={(e) => setModalAmount(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-sm dark:text-white" />
           </div>
           <button onClick={handleUpdateSim} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">Update Plan</button>
        </div>
      </Modal>

      <Modal isOpen={isAddDPSOpen} onClose={() => { setIsAddDPSOpen(false); setEditingTransaction(null); }} title={editingTransaction ? "Edit DPS Installment" : "Add DPS Installment"}>
        <div className="space-y-5">
           <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Name (Read Only)</label><input type="text" value={savingsPlan.bankName} readOnly className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-black text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" /></div>
           <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Period</label>
             <div className="flex gap-3">
               <select value={dpsMonth} onChange={(e) => setDpsMonth(e.target.value)} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-black text-sm dark:text-white">
                 {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
               </select>
               <input type="number" value={dpsYear} onChange={(e) => setDpsYear(e.target.value)} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-black text-sm dark:text-white" />
             </div>
           </div>
           <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount (৳)</label><input type="number" value={dpsAmount} onChange={(e) => setDpsAmount(e.target.value)} className="w-full p-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-2xl outline-none font-black text-sm dark:text-white shadow-sm" /></div>
           <button onClick={handleSaveDPS} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">{editingTransaction ? "Update" : "Confirm"}</button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Delete">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></div>
          <p className="text-slate-800 dark:text-white font-bold text-lg">Remove Entry?</p>
          <div className="grid grid-cols-2 gap-3 mt-6"><button onClick={() => setIsDeleteConfirmOpen(false)} className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button><button onClick={confirmDelete} className="py-3 px-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 active:scale-95">Delete</button></div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteAllOpen} onClose={() => setIsDeleteAllOpen(false)} title="Confirm Clear All">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </div>
          <p className="text-slate-800 dark:text-white font-black text-xl tracking-tight">Clear All DPS History?</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm px-6 font-medium">This will permanently delete <span className="text-rose-600 font-black">ALL</span> recorded installments. This action cannot be reversed.</p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button onClick={() => setIsDeleteAllOpen(false)} className="py-3.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
            <button onClick={handleClearAll} className="py-3.5 px-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl hover:bg-rose-700 active:scale-95 uppercase text-[10px] tracking-widest">Clear All</button>
          </div>
        </div>
      </Modal>

      <button className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-light hover:scale-110 active:scale-95 transition-all z-[60]" onClick={() => { setDpsMonth((now.getMonth() + 1).toString().padStart(2, '0')); setDpsYear(now.getFullYear().toString()); setDpsAmount(savingsPlan.amount.toString()); setEditingTransaction(null); setIsAddDPSOpen(true); }}>+</button>
    </div>
  );
};
