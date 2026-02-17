import React, { useState, useMemo } from 'react';
import { 
  ChevronRight,
  ChevronLeft,
  X,
  Bell,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Transaction, SavingGoal, Reminder, Holiday, UserProfile, LanguageType } from './types';
import { SavingsPlan } from './App';
import { getCategoryIcon } from './utils';

interface DashboardViewProps {
  metrics: any[];
  bills: any[];
  savings: SavingGoal[];
  transactions: Transaction[];
  reminders: Reminder[];
  holidays: Holiday[];
  savingsPlan: SavingsPlan;
  onAddHoliday: (h: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
  userProfile?: UserProfile;
  language?: LanguageType;
  attendanceRecords?: any[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  transactions, 
  savings, 
  reminders, 
  language = 'en', 
  userProfile = { name: 'User', email: '', avatar: '' },
  attendanceRecords = []
}) => {
  const [engViewDate, setEngViewDate] = useState(new Date());
  const [bnViewDate, setBnViewDate] = useState(new Date());
  const [popupInfo, setPopupInfo] = useState<{
    date: Date;
    type: 'en-to-bn' | 'bn-to-en';
  } | null>(null);

  const translations = {
    en: {
      welcome: 'Welcome back,',
      overview: 'System Overview',
      monthlySpending: 'Monthly Spending',
      monthlyIncome: 'Monthly Income',
      savings: 'Active Savings',
      attendance: 'Attendance Rate',
      latestActivity: 'Latest Activity',
      activeReminders: 'Active Reminders',
      seeAll: 'See All',
      bnEquivalent: 'Bengali Date:',
      enEquivalent: 'English Date:',
      close: 'Close',
      noReminders: 'No active reminders',
      overdue: 'OVERDUE',
      upcoming: 'UPCOMING',
      day: 'DAY',
      days: 'DAYS'
    },
    bn: {
      welcome: 'স্বাগতম,',
      overview: 'সিস্টেম ওভারভিউ',
      monthlySpending: 'মাসিক ব্যয়',
      monthlyIncome: 'মাসিক আয়',
      savings: 'সক্রিয় সঞ্চয়',
      attendance: 'উপস্থিতির হার',
      latestActivity: 'সাম্প্রতিক কার্যকলাপ',
      activeReminders: 'সক্রিয় রিমাইন্ডার',
      seeAll: 'সব দেখুন',
      bnEquivalent: 'বাংলা তারিখ:',
      enEquivalent: 'ইংরেজি তারিখ:',
      close: 'বন্ধ করুন',
      noReminders: 'কোনো রিমাইন্ডার নেই',
      overdue: 'অতিক্রান্ত',
      upcoming: 'আসন্ন',
      day: 'দিন',
      days: 'দিন'
    }
  };

  const t = translations[language === 'bn' ? 'bn' : 'en'];

  const toBengaliDigits = (num: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num.toString().replace(/\d/g, (d) => bnDigits[parseInt(d)]);
  };

  const getDayDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const today = new Date();

  const getProgressStyles = (value: number, type: 'income' | 'spending' | 'savings' | 'attendance', percent: number) => {
    const colorMap = {
      income: 'bg-emerald-500',
      spending: 'bg-rose-500',
      savings: 'bg-indigo-500',
      attendance: 'bg-blue-500'
    };
    return { width: `${Math.min(percent, 100)}%`, color: colorMap[type] };
  };

  const stats = useMemo(() => {
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthStr = currentMonth.toString().padStart(2, '0');
    const yearStr = currentYear.toString();

    const currentMonthTxs = transactions.filter(tx => {
      const [y, m] = tx.date.split('-');
      return y === yearStr && m === monthStr;
    });

    const income = currentMonthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const spending = currentMonthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const totalCurrentSavings = savings.reduce((sum, goal) => sum + goal.current, 0);
    const totalTargetSavings = savings.reduce((sum, goal) => sum + goal.target, 0);

    const currentMonthAttendance = (attendanceRecords || []).filter(a => a.date.startsWith(`${yearStr}-${monthStr}`));
    const presentDays = currentMonthAttendance.filter(a => a.status === 'PRESENT').length;
    const totalWorkingDays = currentMonthAttendance.filter(a => a.type === 'Standard').length;
    const attendanceRate = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    const spendingPercent = income > 0 ? Math.round((spending / income) * 100) : (spending > 0 ? 100 : 0);
    const savingsPercent = totalTargetSavings > 0 ? Math.round((totalCurrentSavings / totalTargetSavings) * 100) : (totalCurrentSavings > 0 ? 100 : 0);

    const formatCurr = (val: number) => language === 'en' ? `৳ ${val.toLocaleString()}` : `৳ ${toBengaliDigits(val.toLocaleString())}`;

    return [
      { label: t.monthlyIncome, value: formatCurr(income), styles: getProgressStyles(income, 'income', 100), labelColor: 'text-emerald-600 dark:text-emerald-400', cardStyles: 'bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 hover:border-emerald-400' },
      { label: t.monthlySpending, value: formatCurr(spending), styles: getProgressStyles(spending, 'spending', spendingPercent), labelColor: 'text-rose-600 dark:text-rose-400', cardStyles: 'bg-rose-50/40 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 hover:border-rose-400' },
      { label: t.savings, value: formatCurr(totalCurrentSavings), styles: getProgressStyles(totalCurrentSavings, 'savings', savingsPercent), labelColor: 'text-indigo-600 dark:text-indigo-400', cardStyles: 'bg-indigo-50/40 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 hover:border-indigo-400' },
      { label: t.attendance, value: language === 'en' ? `${attendanceRate}%` : `${toBengaliDigits(attendanceRate)}%`, styles: getProgressStyles(attendanceRate, 'attendance', attendanceRate), labelColor: 'text-blue-600 dark:text-blue-400', cardStyles: 'bg-blue-50/40 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 hover:border-blue-400' }
    ];
  }, [transactions, savings, attendanceRecords, language, t]);

  const bnMonths = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
  const bnWeekDays = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র"];
  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);

  const getBengaliMonthInfo = (d: Date) => {
    const day = d.getDate();
    const m = d.getMonth();
    const y = d.getFullYear();
    const bnYear = (m < 3 || (m === 3 && day < 14)) ? y - 594 : y - 593;
    const starts = [
      new Date(y-1, 3, 14), new Date(y-1, 4, 15), new Date(y-1, 5, 15), new Date(y-1, 6, 16), new Date(y-1, 7, 16), new Date(y-1, 8, 16),
      new Date(y-1, 9, 17), new Date(y-1, 10, 16), new Date(y-1, 11, 16), new Date(y, 0, 15), new Date(y, 1, 14), new Date(y, 2, 16),
      new Date(y, 3, 14), new Date(y, 4, 15), new Date(y, 5, 15), new Date(y, 6, 16), new Date(y, 7, 16), new Date(y, 8, 16),
      new Date(y, 9, 17), new Date(y, 10, 16), new Date(y, 11, 16), new Date(y+1, 0, 15), new Date(y+1, 1, 14), new Date(y+1, 2, 16)
    ];
    let activeIdx = 0;
    for (let i = 0; i < starts.length; i++) { if (d >= starts[i]) activeIdx = i; else break; }
    const currentBnMonthStart = starts[activeIdx];
    const bnMonthIdx = activeIdx % 12;
    const daysInMonth = (bnMonthIdx < 6) ? 31 : (bnMonthIdx === 10 && isLeapYear(currentBnMonthStart.getFullYear())) ? 31 : 30;
    const bnDay = Math.floor((d.getTime() - currentBnMonthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return { bnDay, bnMonthIdx, bnYear, daysInMonth, startGregorian: currentBnMonthStart };
  };

  const bnInfo = useMemo(() => getBengaliMonthInfo(bnViewDate), [bnViewDate]);
  const currentBnInfo = useMemo(() => getBengaliMonthInfo(today), [today]);

  const engDays = useMemo(() => {
    const y = engViewDate.getFullYear(), m = engViewDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay(), daysInMonth = new Date(y, m + 1, 0).getDate();
    const arr = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => i + 1));
    return arr;
  }, [engViewDate]);

  const bnDaysGrid = useMemo(() => {
    const firstDayOfWeek = (bnInfo.startGregorian.getDay() + 1) % 7;
    return Array(firstDayOfWeek).fill(null).concat(Array.from({length: bnInfo.daysInMonth}, (_, i) => i + 1));
  }, [bnInfo]);

  const handleDayClick = (day: number, type: 'en' | 'bn') => {
    const clickedDate = type === 'en' ? new Date(engViewDate.getFullYear(), engViewDate.getMonth(), day) : 
      new Date(bnInfo.startGregorian.getTime() + (day - 1) * 86400000);
    setPopupInfo({ date: clickedDate, type: type === 'en' ? 'en-to-bn' : 'bn-to-en' });
  };

  const getPopupContent = () => {
    if (!popupInfo) return null;
    const info = getBengaliMonthInfo(popupInfo.date);
    const langSuffix = language === 'en' ? 'en-US' : 'bn-BD';
    if (popupInfo.type === 'en-to-bn') {
      return (
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.bnEquivalent}</p>
          <h4 className="text-xl font-black text-white">{toBengaliDigits(info.bnDay)} {bnMonths[info.bnMonthIdx]} {toBengaliDigits(info.bnYear)}</h4>
          <p className="text-[9px] font-bold text-white/50 uppercase">{popupInfo.date.toLocaleDateString(langSuffix, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.enEquivalent}</p>
        <h4 className="text-xl font-black text-white">{popupInfo.date.toLocaleDateString(langSuffix, { day: 'numeric', month: 'long', year: 'numeric' })}</h4>
        <p className="text-[9px] font-bold text-white/50 uppercase">{toBengaliDigits(info.bnDay)} {bnMonths[info.bnMonthIdx]} {toBengaliDigits(info.bnYear)}</p>
      </div>
    );
  };

  const activeRemindersList = useMemo(() => reminders.filter(r => !r.completed).sort((a,b) => {
    const p = { high: 0, medium: 1, low: 2 }; return p[a.priority] - p[b.priority];
  }).slice(0, 5), [reminders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {popupInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in" onClick={() => setPopupInfo(null)}>
          <div className={`w-full max-w-[300px] rounded-[32px] p-8 shadow-2xl border relative overflow-hidden animate-in zoom-in-95 ${popupInfo.type === 'en-to-bn' ? 'bg-indigo-900 border-indigo-500/30' : 'bg-emerald-900 border-emerald-500/30'}`} onClick={e => e.stopPropagation()}>
            <button onClick={() => setPopupInfo(null)} className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl"><X size={16} /></button>
            <div className="py-6">{getPopupContent()}</div>
            <button onClick={() => setPopupInfo(null)} className="w-full mt-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10">{t.close}</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{t.welcome} {userProfile.name}</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">{t.overview}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className={`p-6 rounded-[32px] shadow-sm relative overflow-hidden group transition-all flex flex-col justify-between border-2 hover:ring-4 ${stat.cardStyles}`}>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${stat.labelColor}`}>{stat.label}</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stat.value}</h3>
              </div>
              <div className="mt-6 w-full h-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full ${stat.styles.color} rounded-full transition-all duration-700 ease-out`} style={{ width: stat.styles.width }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 shadow-sm hover:border-indigo-500 transition-all h-fit">
          <div className="-mx-4 -mt-4 mb-3 p-3 bg-indigo-600 dark:bg-indigo-700 flex items-center justify-between shadow-md">
            <button onClick={() => setEngViewDate(new Date(engViewDate.getFullYear(), engViewDate.getMonth() - 1, 1))} className="text-white hover:bg-white/10 p-1 rounded-lg"><ChevronLeft size={16} /></button>
            <span className="text-[11px] font-black text-white uppercase tracking-widest">{engViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setEngViewDate(new Date(engViewDate.getFullYear(), engViewDate.getMonth() + 1, 1))} className="text-white hover:bg-white/10 p-1 rounded-lg"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d} className="text-[8px] font-black text-indigo-700 dark:text-indigo-300 uppercase py-1.5 mb-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md">{d}</span>)}
            {engDays.map((d, i) => (
              <button key={i} disabled={!d} onClick={() => d && handleDayClick(d, 'en')} className={`h-7 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all ${d === today.getDate() && today.getMonth() === engViewDate.getMonth() && today.getFullYear() === engViewDate.getFullYear() ? 'bg-indigo-600 text-white shadow-lg scale-110' : d ? 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800' : ''}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 shadow-sm hover:border-emerald-500 transition-all h-fit">
          <div className="-mx-4 -mt-4 mb-3 p-3 bg-emerald-600 dark:bg-emerald-700 flex items-center justify-between shadow-md">
            <button onClick={() => setBnViewDate(new Date(bnInfo.startGregorian.getTime() - 86400000 * 20))} className="text-white hover:bg-white/10 p-1 rounded-lg"><ChevronLeft size={16} /></button>
            <span className="text-[11px] font-black text-white uppercase tracking-widest">{bnMonths[bnInfo.bnMonthIdx]} {toBengaliDigits(bnInfo.bnYear)}</span>
            <button onClick={() => setBnViewDate(new Date(bnInfo.startGregorian.getTime() + 86400000 * 40))} className="text-white hover:bg-white/10 p-1 rounded-lg"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {bnWeekDays.map(d => <span key={d} className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase py-1.5 mb-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-md">{d}</span>)}
            {bnDaysGrid.map((d, i) => (
              <button key={i} disabled={!d} onClick={() => d && handleDayClick(d, 'bn')} className={`h-7 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all ${d === currentBnInfo.bnDay && currentBnInfo.bnMonthIdx === bnInfo.bnMonthIdx && currentBnInfo.bnYear === bnInfo.bnYear ? 'bg-emerald-600 text-white shadow-lg scale-110' : d ? 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800' : ''}`}>
                {d ? toBengaliDigits(d) : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 shadow-sm h-full flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3"><div className="w-1.5 h-4 bg-amber-500 rounded-full" /> {t.activeReminders}</h3>
              <button className="text-[9px] font-black text-amber-600 uppercase tracking-widest hover:underline">{t.seeAll}</button>
           </div>
           <div className="space-y-2.5 flex-1">
             {activeRemindersList.length > 0 ? activeRemindersList.map((reminder) => {
               const diff = getDayDiff(reminder.date), isOverdue = diff < 0, abs = Math.abs(diff);
               const pCol = reminder.priority === 'high' ? 'rose' : reminder.priority === 'medium' ? 'amber' : 'blue';
               return (
                 <div key={reminder.id} className={`flex items-center justify-between py-2.5 px-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-l-4 border-l-${pCol}-500 hover:bg-white dark:hover:bg-slate-900 shadow-sm border-slate-200/50 dark:border-slate-800`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-${pCol}-100 text-${pCol}-600`}><Bell size={16} /></div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{reminder.title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                           <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter"><Clock size={10} /> {reminder.date}</span>
                           <span className={`text-[8px] font-black uppercase tracking-widest ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>{language === 'bn' ? toBengaliDigits(abs) : abs} {abs === 1 ? t.day : t.days} {isOverdue ? t.overdue : t.upcoming}</span>
                        </div>
                      </div>
                    </div>
                 </div>
               );
             }) : <div className="text-center py-10 opacity-30 italic text-[11px] font-bold uppercase tracking-widest">{t.noReminders}</div>}
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 shadow-sm h-full flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3"><div className="w-1.5 h-4 bg-indigo-600 rounded-full" /> {t.latestActivity}</h3>
              <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">{t.seeAll}</button>
           </div>
           <div className="space-y-2.5 flex-1">
             {transactions.length > 0 ? [...transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5).map((tx, i) => (
               <div key={tx.id || i} className={`flex items-center justify-between py-2.5 px-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border-l-4 border-${tx.type === 'income' ? 'emerald' : 'rose'}-500 hover:bg-white dark:hover:bg-slate-900 shadow-sm border-slate-200/50 dark:border-slate-800`}>
                   <div className="flex items-center gap-3">
                     <div className="p-1.5 rounded-lg bg-white/10 dark:bg-slate-800">{getCategoryIcon(tx.category)}</div>
                     <div><p className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{tx.category}</p><p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">{tx.date}</p></div>
                   </div>
                   <div className="text-right"><p className={`text-[13px] font-black tracking-tight ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}</p></div>
               </div>
             )) : <div className="text-center py-10 opacity-30 italic text-[11px] font-bold uppercase tracking-widest">No recent activities</div>}
           </div>
        </div>
      </div>
    </div>
  );
};
