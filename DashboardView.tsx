
import React, { useMemo, useState } from 'react';
import { Bill, SavingGoal, Transaction, Reminder, Holiday } from './types';
import { getFullBengaliCombinedDate, getCategoryIcon, formatDate } from './utils';
import { Card, Modal } from './components';
import { SavingsPlan } from './App';
import { ICONS } from './constants';

interface DashboardViewProps {
  metrics: any[];
  bills: Bill[];
  savings: SavingGoal[];
  transactions: Transaction[];
  reminders: Reminder[];
  holidays: Holiday[];
  savingsPlan: SavingsPlan;
  onAddHoliday: (h: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
}

const CHART_COLORS = ['#1e3a8a', '#0891b2', '#10b981', '#84cc16', '#581c87', '#ef4444', '#f59e0b', '#d946ef', '#64748b'];

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  metrics, bills, savings, transactions, reminders, holidays, savingsPlan, onAddHoliday, onDeleteHoliday 
}) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: new Date().toISOString().split('T')[0] });

  // Utility for relative date strings
  const getRelativeDateInfo = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
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

  // Calculate Financial Stats for the current month
  const financialStats = useMemo(() => {
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear().toString();
    const monthKey = `${currentYear}-${currentMonth}`;

    const currentMonthTransactions = transactions.filter(t => t.date.startsWith(monthKey));

    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate Breakdown for the right column
    const cats: Record<string, number> = {};
    const expensesOnly = currentMonthTransactions.filter(t => t.type === 'expense');
    expensesOnly.forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    
    const breakdown = Object.entries(cats)
      .map(([name, value]) => ({ 
        name, 
        value, 
        percentage: expense > 0 ? (value / expense) * 100 : 0 
      }))
      .sort((a, b) => b.value - a.value);

    return { income, expense, balance: income - expense, breakdown, totalExpense: expense };
  }, [transactions]);

  // Optimized logic for Savings Goal Card
  const detailedProgress = useMemo(() => {
    const dpsTransactions = transactions
      .filter(t => t.category === 'DPS' && t.type === 'expense')
      .sort((a, b) => a.date.localeCompare(b.date));

    const simRate = savingsPlan.rate;
    const simYears = savingsPlan.years;
    const simAmount = savingsPlan.amount;

    const n = simYears * 12; 
    const i = (simRate / 100) / 12; 
    const p = simAmount; 
    
    const plannedPrincipal = p * n;
    const plannedMaturity = Math.round(p * (((Math.pow(1 + i, n) - 1) / i) * (1 + i)));

    let currentGTotal = 0;
    const completedMonths = dpsTransactions.length;
    
    for (let j = 0; j < completedMonths; j++) {
      const monthlyDeposit = dpsTransactions[j]?.amount || 0;
      const monthlyProfit = j === 0 ? 0 : Math.round(currentGTotal * ((simRate / 100) / 12));
      currentGTotal += monthlyDeposit + monthlyProfit;
    }

    const remainingMonths = Math.max(0, n - completedMonths);
    const comYears = Math.floor(completedMonths / 12);
    const comMonths = completedMonths % 12;
    const remYears = Math.floor(remainingMonths / 12);
    const remMonths = remainingMonths % 12;

    return {
      goalName: savingsPlan.bankName,
      current: currentGTotal,
      target: plannedMaturity,
      plannedPrincipal,
      completedMonths,
      remainingMonths,
      comYears,
      comMonths,
      remYears,
      remMonths,
      percent: plannedMaturity > 0 ? Math.round((currentGTotal / plannedMaturity) * 100) : 0
    };
  }, [transactions, savingsPlan]);

  // All upcoming reminders sorted: Future items first (soonest first), then Past items (recent first, oldest at bottom)
  const upcomingRemindersList = useMemo(() => {
    return reminders
      .filter(r => !r.completed)
      .sort((a, b) => {
        const isPastA = a.date < todayStr;
        const isPastB = b.date < todayStr;

        if (isPastA && !isPastB) return 1;  // A is past, B is future -> B comes first
        if (!isPastA && isPastB) return -1; // A is future, B is past -> A comes first
        
        if (!isPastA && !isPastB) {
          // Both future: Ascending (soonest first)
          return a.date.localeCompare(b.date);
        } else {
          // Both past: Descending (recent overdue first, oldest at bottom)
          return b.date.localeCompare(a.date);
        }
      });
  }, [reminders, todayStr]);

  // Upcoming holidays
  const upcomingHolidays = useMemo(() => {
    return holidays
      .filter(h => new Date(h.date) >= new Date(new Date().setHours(0,0,0,0)))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays]);

  const handleSaveHoliday = () => {
    if (!newHoliday.name.trim()) return;
    onAddHoliday({ id: Math.random().toString(36).substr(2, 9), ...newHoliday });
    setIsHolidayModalOpen(false);
    setNewHoliday({ name: '', date: new Date().toISOString().split('T')[0] });
  };

  const requestDeleteHoliday = (h: Holiday) => {
    setHolidayToDelete(h);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteHoliday = () => {
    if (holidayToDelete) {
      onDeleteHoliday(holidayToDelete.id);
      setIsDeleteConfirmOpen(false);
      setHolidayToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 lg:pb-0">
      {/* Date Header Section */}
      <div className="flex items-center space-x-2 px-1 sm:px-2">
        <div className="text-slate-500 dark:text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <p className="text-[11px] sm:text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">
          {getFullBengaliCombinedDate(today)}
        </p>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 relative flex flex-col justify-center transition-transform hover:-translate-y-1 min-h-[110px]">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">Total Income</p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
              <span>↑</span> 0%
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">৳{financialStats.income.toLocaleString()}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 border-t-4 border-t-rose-500 relative flex flex-col justify-center transition-transform hover:-translate-y-1 min-h-[110px]">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">Total Expense</p>
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
              <span>↓</span> 0%
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">৳{financialStats.expense.toLocaleString()}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 border-t-4 border-t-blue-600 relative flex flex-col justify-center transition-transform hover:-translate-y-1 min-h-[110px]">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">Balance</p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
              <span>↑</span> 0%
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">৳{financialStats.balance.toLocaleString()}</h3>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-1 border-l-4 border-blue-600 pl-3">Savings Goals Progress</h4>
            <Card className="relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-150 transition-transform duration-700" />
              {detailedProgress ? (
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-black text-slate-800 dark:text-white text-lg sm:text-xl tracking-tight uppercase">{detailedProgress.goalName}</h5>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{savingsPlan.years} YEARS PLAN • GOAL TARGETED</p>
                    </div>
                    <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                      {detailedProgress.percent}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">GOAL TARGET</p>
                      <p className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 uppercase whitespace-nowrap">৳{detailedProgress.plannedPrincipal.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">MATURITY VALUE</p>
                      <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase whitespace-nowrap">৳{detailedProgress.target.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <span>Overall Progress</span>
                      <span className="text-blue-600 dark:text-blue-400 font-black">{detailedProgress.completedMonths} Complete / {detailedProgress.remainingMonths} Remaining</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm bg-blue-600" style={{ width: `${Math.min(100, detailedProgress.percent)}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                      <span>Com- {detailedProgress.comYears} Years {detailedProgress.comMonths} Month</span>
                      <span>Rem- {detailedProgress.remYears} Years {detailedProgress.remMonths} Month</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center"><p className="text-slate-400 italic text-sm">No savings plan found.</p></div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-1 border-l-4 border-indigo-600 pl-3">Upcoming Reminders</h4>
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                {upcomingRemindersList.length > 0 ? (
                  upcomingRemindersList.map(reminder => {
                    const relativeInfo = getRelativeDateInfo(reminder.date);
                    return (
                      <div key={reminder.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors gap-2">
                        <div className="flex flex-col min-w-0">
                          <h5 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm truncate">{reminder.title}</h5>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{formatDate(reminder.date)}</span>
                          </div>
                        </div>
                        <span className={`text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-right shrink-0 ${relativeInfo.includes('overdue') ? 'text-rose-500 animate-pulse' : 'text-blue-500'}`}>
                          {relativeInfo}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center"><p className="text-slate-400 italic text-[10px] uppercase tracking-widest">No upcoming reminders</p></div>
                )}
              </div>
            </Card>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-1 border-l-4 border-emerald-600 pl-3">Monthly Expense Breakdown</h4>
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                {financialStats.breakdown.length > 0 ? (
                  financialStats.breakdown.map((item, idx) => {
                    const catColor = CHART_COLORS[idx % CHART_COLORS.length];
                    return (
                      <div key={item.name} className="space-y-1 group">
                        <div className="flex justify-between items-end text-sm">
                          <div className="flex items-center space-x-2.5">
                            <div className="p-1.5 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{ backgroundColor: `${catColor}15` }}>{getCategoryIcon(item.name, catColor)}</div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm tracking-tight">{item.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 font-bold">
                            <span className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm">৳{item.value.toLocaleString()}</span>
                            <span className="text-blue-500 dark:text-blue-400 text-[10px] sm:text-xs">({item.percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden ml-1">
                          <div className="h-full rounded-full transition-all duration-700 ease-out shadow-sm" style={{ width: `${item.percentage}%`, backgroundColor: catColor }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center"><p className="text-slate-400 italic text-xs font-bold uppercase tracking-widest">No expenses this month</p></div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center pr-1">
              <h4 className="text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-1 border-l-4 border-rose-500 pl-3">Public Holiday</h4>
              <button 
                onClick={() => setIsHolidayModalOpen(true)}
                className="w-7 h-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-all"
                title="Add Holiday"
              >
                <span className="text-xl font-bold leading-none">+</span>
              </button>
            </div>
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {upcomingHolidays.length > 0 ? (
                  upcomingHolidays.map(holiday => {
                    const relativeInfo = getRelativeDateInfo(holiday.date);
                    const isOverdue = relativeInfo.includes('overdue');
                    return (
                      <div key={holiday.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-rose-50 dark:border-rose-900/20 bg-rose-50/10 dark:bg-rose-900/10 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                           </div>
                           <div className="min-w-0">
                             <h5 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm truncate">{holiday.name}</h5>
                             <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{formatDate(holiday.date)}</p>
                           </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                          <span className={`text-[7px] sm:text-[9px] font-black uppercase tracking-widest shrink-0 ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-blue-500'}`}>
                            {relativeInfo}
                          </span>
                          <button 
                            onClick={() => requestDeleteHoliday(holiday)}
                            className="w-8 h-8 flex items-center justify-center bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-all active:scale-90"
                            title="Delete Holiday"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center"><p className="text-slate-400 italic text-[10px] uppercase tracking-widest">No holidays listed</p></div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      <Modal isOpen={isHolidayModalOpen} onClose={() => setIsHolidayModalOpen(false)} title="Add Public Holiday">
        <div className="space-y-5">
           <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Holiday Title</label>
             <input 
              type="text" 
              value={newHoliday.name} 
              onChange={e => setNewHoliday({...newHoliday, name: e.target.value})}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900/20 font-bold text-sm dark:text-white"
              placeholder="e.g. Eid-ul-Fitr"
             />
           </div>
           <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Holiday Date</label>
             <input 
              type="date" 
              value={newHoliday.date} 
              onChange={e => setNewHoliday({...newHoliday, date: e.target.value})}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900/20 font-bold text-sm dark:text-white"
             />
           </div>
           <button 
            onClick={handleSaveHoliday}
            className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl shadow-xl hover:bg-rose-600 active:scale-95 transition-all uppercase tracking-widest text-xs"
           >
             Save Holiday
           </button>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Remove Public Holiday">
        <div className="text-center space-y-4 p-2">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </div>
          <p className="font-bold text-slate-800 dark:text-white">Delete this holiday?</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs px-4">The holiday <span className="text-rose-600 font-bold">"{holidayToDelete?.name}"</span> will be removed from your dashboard.</p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button onClick={() => setIsDeleteConfirmOpen(false)} className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest">Cancel</button>
            <button onClick={confirmDeleteHoliday} className="py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all active:scale-95 shadow-lg uppercase text-[10px] tracking-widest">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
