
import React, { useMemo, useState } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Transaction, SavingsGoal, Reminder } from './types';
import { ICONS } from './constants';
import { getBengaliMonthDetails, toBnDigits } from './utils';

interface DashboardViewProps {
  language: 'English' | 'বাংলা';
  profile: any;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  attendanceList: any[];
  reminders: Reminder[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ language, profile, transactions, savingsGoals, attendanceList, reminders }) => {
  // Calendar States
  const [enCalendarDate, setEnCalendarDate] = useState(new Date());
  const [bnCalendarDate, setBnCalendarDate] = useState(new Date());

  const translations = {
    English: {
      welcome: 'Welcome back,',
      overview: 'System Overview',
      monthlySpending: 'Monthly Spending',
      monthlyIncome: 'Monthly Income',
      savings: 'Active Savings',
      attendance: 'Attendance Rate',
      latestActivity: 'Latest Activity',
      activeReminders: 'Active Reminders',
      today: 'TODAY'
    },
    'বাংলা': {
      welcome: 'স্বাগতম,',
      overview: 'সিস্টেম ওভারভিউ',
      monthlySpending: 'মাসিক ব্যয়',
      monthlyIncome: 'মাসিক আয়',
      savings: 'সক্রিয় সঞ্চয়',
      attendance: 'উপস্থিতির হার',
      latestActivity: 'সাম্প্রতিক কার্যকলাপ',
      activeReminders: 'সক্রিয় রিমাইন্ডার',
      today: 'আজ'
    }
  };

  const t = translations[language];

  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString();
    const sign = val < 0 ? '-' : '';
    return language === 'English' ? `${sign}৳${formatted}` : `${sign}৳${toBnDigits(formatted)}`;
  };

  const stats = useMemo(() => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const monthTxs = transactions.filter(tx => tx.date.startsWith(currentMonthStr));
    
    const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalSavings = (savingsGoals || []).reduce((s, g) => s + g.currentAmount, 0);
    
    // Calculate dynamic Attendance Rate
    const relevantAttendance = (attendanceList || []).filter(a => 
      ['On Time', 'Late', 'Absent', 'Out Missing'].includes(a.status)
    );
    const presentDays = (attendanceList || []).filter(a => ['On Time', 'Late'].includes(a.status)).length;
    const attendanceRate = relevantAttendance.length > 0 
      ? Math.round((presentDays / relevantAttendance.length) * 100) 
      : 0;

    // Calculate overall savings progress
    const totalTarget = (savingsGoals || []).reduce((s, g) => s + g.targetAmount, 0);
    const savingsProgress = totalTarget > 0 
      ? Math.round((totalSavings / totalTarget) * 100) 
      : 0;

    return { 
      income, 
      expense, 
      totalSavings, 
      attendanceRate,
      savingsProgress 
    };
  }, [transactions, savingsGoals, attendanceList]);

  // English Calendar logic
  const englishDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const generateEnCalendarGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let i = 1; i <= lastDate; i++) grid.push(i);
    return grid;
  };

  // Bengali Calendar logic
  const bengaliDays = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র'];
  const generateBnCalendarGrid = (viewDate: Date) => {
    const details = getBengaliMonthDetails(viewDate);
    const firstOfBnMonth = new Date(viewDate);
    firstOfBnMonth.setDate(firstOfBnMonth.getDate() - (details.day - 1));
    firstOfBnMonth.setHours(0, 0, 0, 0);
    const firstDayOfWeek = firstOfBnMonth.getDay();
    const bnDayOffset = (firstDayOfWeek + 1) % 7; 
    const grid = [];
    for (let i = 0; i < bnDayOffset; i++) grid.push(null);
    for (let i = 1; i <= details.daysInMonth; i++) grid.push(i);
    return grid;
  };

  const navigateEnMonth = (offset: number) => {
    setEnCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const navigateBnMonth = (offset: number) => {
    setBnCalendarDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + (offset * 30));
      return next;
    });
  };

  const enGrid = generateEnCalendarGrid(enCalendarDate);
  const bnGrid = generateBnCalendarGrid(bnCalendarDate);
  const bnInfo = getBengaliMonthDetails(bnCalendarDate);
  const today = new Date();
  const todayDetails = getBengaliMonthDetails(today);

  // Helper for progress bar classes to avoid JIT issues with dynamic strings
  const getProgressColor = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-500';
      case 'rose': return 'bg-rose-500';
      case 'indigo': return 'bg-indigo-600';
      case 'blue': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  const mainStats = [
    { 
      label: t.monthlyIncome, 
      value: stats.income, 
      icon: <ArrowUpRight size={18} />, 
      color: 'emerald',
      progress: stats.income > 0 ? 100 : 0
    },
    { 
      label: t.monthlySpending, 
      value: stats.expense, 
      icon: <ArrowDownRight size={18} />, 
      color: 'rose',
      progress: stats.income > 0 ? Math.round(Math.min((stats.expense / stats.income) * 100, 100)) : (stats.expense > 0 ? 100 : 0) 
    },
    { 
      label: t.savings, 
      value: stats.totalSavings, 
      icon: <DollarSign size={18} />, 
      color: 'indigo',
      progress: stats.savingsProgress 
    },
    { 
      label: t.attendance, 
      value: `${stats.attendanceRate}%`, 
      icon: <ICONS.Clock size={18} />, 
      color: 'blue',
      progress: stats.attendanceRate 
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t.welcome} <span className="text-indigo-600">{profile.name}</span>
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.overview}</p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Stats */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-3 content-start">
          {mainStats.map((stat, i) => (
            <div key={i} className="p-3 pt-3 pb-3 h-[112px] rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex flex-col min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 text-${stat.color}-600 dark:text-${stat.color}-400 truncate`}>
                    {stat.label}
                  </p>
                  <h3 className="text-[17px] font-black text-slate-800 dark:text-white tracking-tight truncate">
                    {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
                  </h3>
                </div>
                <div className={`w-8 h-8 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                  {stat.icon}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Status</span>
                  <span className={`text-${stat.color}-600`}>{stat.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor(stat.color)} transition-all duration-1000 ease-out rounded-full`}
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Calendars */}
        <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* English Calendar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm overflow-hidden animate-in slide-in-from-right duration-700">
            <div className="bg-indigo-600 py-2.5 px-4 flex items-center justify-between text-white">
              <button onClick={() => navigateEnMonth(-1)} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                {enCalendarDate.toLocaleString('default', { month: 'long' })} {enCalendarDate.getFullYear()}
              </h3>
              <button onClick={() => navigateEnMonth(1)} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><ChevronRight size={16} /></button>
            </div>
            <div className="p-3 pt-4 pb-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {englishDays.map(day => (
                  <span key={day} className="text-[8px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 py-1 rounded-md text-center">{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center">
                {enGrid.map((day, i) => {
                  const isToday = day === today.getDate() && enCalendarDate.getMonth() === today.getMonth() && enCalendarDate.getFullYear() === today.getFullYear();
                  return (
                    <div key={i} className="relative flex items-center justify-center h-7 w-full">
                      {day && (
                        <>
                          {isToday && (
                            <div className="absolute inset-0 m-auto w-6 h-6 bg-indigo-600 rounded-lg shadow-md shadow-indigo-600/40 z-0" />
                          )}
                          <span className={`text-[11px] font-black z-10 transition-colors ${isToday ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {day}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bengali Calendar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm overflow-hidden animate-in slide-in-from-right duration-700">
            <div className="bg-emerald-600 py-2.5 px-4 flex items-center justify-between text-white">
              <button onClick={() => navigateBnMonth(-1)} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
              <h3 className="text-[10px] font-black uppercase tracking-widest">{bnInfo.monthName} {toBnDigits(bnInfo.year)}</h3>
              <button onClick={() => navigateBnMonth(1)} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><ChevronRight size={16} /></button>
            </div>
            <div className="p-3 pt-4 pb-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {bengaliDays.map(day => (
                  <span key={day} className="text-[8px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 py-1 rounded-md text-center">{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center">
                {bnGrid.map((day, i) => {
                  const isToday = day === todayDetails.day && bnInfo.month === todayDetails.month && bnInfo.year === todayDetails.year;
                  return (
                    <div key={i} className="relative flex items-center justify-center h-7 w-full">
                      {day && (
                        <>
                          {isToday && (
                            <div className="absolute inset-0 m-auto w-6 h-6 bg-emerald-600 rounded-lg shadow-md shadow-emerald-600/40 z-0" />
                          )}
                          <span className={`text-[12px] font-black z-10 transition-colors ${isToday ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {toBnDigits(day)}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">{t.latestActivity}</h3>
            <div className="space-y-3">
              {transactions.slice(0, 8).map(tx => (
                <div key={tx.id} className={`p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex justify-between items-center border-l-4 ${tx.type === 'income' ? 'border-l-emerald-500' : 'border-l-rose-500'} hover:translate-x-1 transition-transform`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{tx.category}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-[13px] font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
             <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">{t.activeReminders}</h3>
             <div className="space-y-4">
               {reminders.filter(r => !r.completed).slice(0, 6).map(r => (
                 <div key={r.id} className="flex items-start gap-4 group">
                   <div className={`w-2 h-10 rounded-full shrink-0 ${r.priority === 'high' ? 'bg-rose-500' : r.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                   <div className="flex-1 min-w-0">
                     <p className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">{r.title}</p>
                     <p className="text-[10px] font-bold text-slate-400 mt-1">{r.date}</p>
                   </div>
                 </div>
               ))}
               {reminders.filter(r => !r.completed).length === 0 && <p className="text-center py-10 text-[11px] font-black uppercase text-slate-400 opacity-50">No alerts</p>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
