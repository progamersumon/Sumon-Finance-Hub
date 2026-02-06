
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewType, Transaction, Bill, SavingGoal, Bet, Reminder, Holiday, LanguageType, ThemeType, UserProfile } from './types';
import { ICONS } from './constants';
import { 
  MOCK_METRICS, MOCK_SAVINGS, 
  MOCK_BILLS, MOCK_TRANSACTIONS, MOCK_BETS, MOCK_REMINDERS
} from './mockData';
import { SidebarItem, Card } from './components';
import { FinancialInfoView } from './FinancialInfoView';
import { SavingsView } from './SavingsView';
import { PayrollView, SalaryHistoryEntry, LeaveRecord, AttendanceRecord, DEFAULT_BASE_DEDUCTION, INITIAL_LEAVE_RECORDS, INITIAL_ATTENDANCE } from './PayrollView';
import { DashboardView } from './DashboardView';
import { BillsView } from './BillsView';
import { BettingView } from './BettingView';
import { RemindersView } from './RemindersView';
import { SettingsView } from './SettingsView';
import { t } from './translations';
import { supabase } from './supabaseClient';

export interface SavingsPlan {
  bankName: string;
  years: number;
  rate: number;
  amount: number;
}

const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'h1', name: 'Shaheed Day', date: '2026-02-21' },
  { id: 'h2', name: 'Independence Day', date: '2026-03-26' },
  { id: 'h3', name: 'Bengali New Year', date: '2026-04-14' },
];

const ADMIN_EMAIL = 'sumonreza3557@gmail.com';

const ADMIN_SALARY_CONFIG = { 
  grossSalary: 31083, 
  medical: 750, 
  conveyance: 450, 
  food: 1250, 
  attendanceBonus: 925, 
  tiffinDays: 25 
};

const ADMIN_HISTORY_ENTRIES: SalaryHistoryEntry[] = [
  { id: 'h9', year: '2025', label: '', increasePercent: 9.00, amountAdd: 2364, total: 31083, baseDeduction: 2450 },
  { id: 'h8', year: '2024', label: '', increasePercent: 7.00, amountAdd: 1719, total: 28719, baseDeduction: 2450 },
  { id: 'h7-2', year: '2023', label: 'Adjust', increasePercent: 0, amountAdd: 2000, total: 27000, baseDeduction: 0 },
  { id: 'h7-1', year: '2023', label: '', increasePercent: 14.89, amountAdd: 3000, total: 25000, baseDeduction: 2450 },
  { id: 'h6', year: '2022', label: '', increasePercent: 23.03, amountAdd: 3772, total: 22000, baseDeduction: 2450 },
  { id: 'h5', year: '2021', label: '', increasePercent: 10.00, amountAdd: 1489, total: 18228, baseDeduction: 2450 },
  { id: 'h4', year: '2020', label: '', increasePercent: 10.00, amountAdd: 1354, total: 16739, baseDeduction: 2450 },
  { id: 'h3', year: '2019', label: '', increasePercent: 7.00, amountAdd: 886, total: 15386, baseDeduction: 2450 },
  { id: 'h1', year: '2018', label: 'Join', increasePercent: 0, amountAdd: 0, total: 14500, baseDeduction: 2450 },
];

const FinanceHubLogo = ({ className = "w-48 h-48", textColor = "text-white" }: { className?: string, textColor?: string }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <div className="relative w-32 h-32 flex items-center justify-center mb-4">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <rect x="25" y="45" width="10" height="35" rx="1.5" fill="#60a5fa" />
        <rect x="42" y="30" width="10" height="50" rx="1.5" fill="#3b82f6" />
        <rect x="59" y="15" width="10" height="65" rx="1.5" fill="#1d4ed8" />
        <g transform="translate(5, 65) rotate(-15)">
          <rect x="0" y="0" width="22" height="12" rx="1" fill="#10b981" />
          <circle cx="11" cy="6" r="3" fill="#059669" opacity="0.4" />
          <text x="11" y="8.5" fontSize="6" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.9">$</text>
        </g>
        <g transform="translate(12, 60) rotate(-5)">
          <rect x="0" y="0" width="22" height="12" rx="1" fill="#34d399" />
          <circle cx="11" cy="6" r="3" fill="#059669" opacity="0.4" />
          <text x="11" y="8.5" fontSize="6" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.9">$</text>
        </g>
        <defs>
          <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <path d="M10 85 Q 50 85, 90 20" fill="none" stroke="url(#arrowGrad)" strokeWidth="6" strokeLinecap="round" />
        <path d="M90 20 L80 22 L86 32 Z" fill="#fbbf24" />
      </svg>
    </div>
    <h1 className={`${textColor} text-4xl font-black tracking-tighter text-center leading-none whitespace-nowrap`}>Finance Hub</h1>
  </div>
);

type LoginMode = 'login' | 'signup' | 'forgot-password-email' | 'forgot-password-otp';

const LoginView: React.FC<{ 
  onLogin: (user: any) => void, 
  language: LanguageType 
}> = ({ onLogin, language }) => {
  const [mode, setMode] = useState<LoginMode>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuthSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    
    if (mode === 'forgot-password-email') {
      if (!formData.email.trim()) {
        setErrorMessage(t('fillAllFields', language));
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
        if (error) throw error;
        setSuccessMessage(t('otpSent', language));
        setMode('forgot-password-otp');
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'forgot-password-otp') {
      if (!formData.otp.trim() || !formData.newPassword.trim()) {
        setErrorMessage(t('fillAllFields', language));
        return;
      }
      setLoading(true);
      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: formData.email,
          token: formData.otp,
          type: 'recovery'
        });
        if (verifyError) throw verifyError;

        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });
        if (updateError) throw updateError;

        setSuccessMessage(t('passwordResetSuccess', language));
        setTimeout(() => setMode('login'), 2000);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage(t('fillAllFields', language));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.name } }
        });
        if (error) throw error;
        setSuccessMessage(language === 'bn' ? "অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল চেক করুন।" : "Account created! Please check your email.");
        setMode('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error(language === 'bn' ? "আপনার ইমেইল ভেরিফাই করা হয়নি।" : "Email not confirmed.");
          }
          throw error;
        }
        if (data.user) onLogin(data.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans">
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-blue-500 to-blue-700 flex-col items-center justify-center p-10 text-center text-white">
        <div className="mb-4">
          <h2 className="text-6xl font-black uppercase tracking-tight mb-2">Welcome Back</h2>
          <p className="text-blue-100 text-lg font-medium opacity-90 tracking-wide">Keep track of your financial journey.</p>
        </div>
        <div className="transform -translate-y-4">
          <FinanceHubLogo />
        </div>
      </div>

      <div className="flex-1 bg-white flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-sm:max-w-[320px] max-w-sm flex flex-col items-center">
          <div className="mb-4 flex flex-col items-center scale-[0.6] md:scale-75 origin-center">
             <div className="md:hidden text-center mb-4">
                <p className="text-blue-600 text-4xl font-black uppercase tracking-tight mb-1">Welcome Back</p>
                <p className="text-blue-400 text-sm font-bold">Keep track of your financial journey.</p>
             </div>
             <div className="transform -translate-y-4 md:translate-y-0">
               <FinanceHubLogo textColor="text-blue-600" />
             </div>
          </div>

          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-blue-600 mb-6 text-center uppercase tracking-tighter">
              {mode === 'login' ? t('login', language) : mode === 'signup' ? t('signUp', language) : t('forgotPassword', language)}
            </h2>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-[10px] font-bold flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {(mode === 'login' || mode === 'signup' || mode === 'forgot-password-email') && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 3"/></svg>
                  </div>
                  <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-blue-50 border-2 border-transparent rounded-lg py-4 pl-12 pr-4 text-blue-900 placeholder-blue-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                </div>
              )}

              {mode === 'signup' && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <input type="text" placeholder={t('fullName', language)} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-blue-50 border-2 border-transparent rounded-lg py-4 pl-12 pr-4 text-blue-900 placeholder-blue-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                </div>
              )}

              {(mode === 'login' || mode === 'signup') && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input type="password" placeholder={t('password', language)} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-blue-50 border-2 border-transparent rounded-lg py-4 pl-12 pr-4 text-blue-900 placeholder-blue-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                </div>
              )}

              {mode === 'forgot-password-otp' && (
                <>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                    </div>
                    <input type="text" placeholder={t('enterOTP', language)} value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})} className="w-full bg-blue-50 border-2 border-transparent rounded-lg py-4 pl-12 pr-4 text-blue-900 placeholder-blue-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input type="password" placeholder={t('enterNewPassword', language)} value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} className="w-full bg-blue-50 border-2 border-transparent rounded-lg py-4 pl-12 pr-4 text-blue-900 placeholder-blue-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                  </div>
                </>
              )}

              <button onClick={handleAuthSubmit} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-4 rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest mt-4 disabled:opacity-70">
                {loading ? 'SUBMITTING...' : (mode === 'forgot-password-email' ? t('sendOTP', language) : mode === 'forgot-password-otp' ? t('verifyAndReset', language) : 'SUBMIT')}
              </button>
              
              <div className="flex flex-col gap-3 items-center pt-4">
                <div className="flex justify-between w-full">
                  <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrorMessage(null); setSuccessMessage(null); }} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                    {mode === 'login' ? t('signUp', language) : t('alreadyHaveAccount', language)}
                  </button>
                  {mode === 'login' && (
                    <button onClick={() => setMode('forgot-password-email')} className="text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-tight">
                      {t('forgotPassword', language)}
                    </button>
                  )}
                </div>
                {(mode === 'forgot-password-email' || mode === 'forgot-password-otp') && (
                  <button onClick={() => setMode('login')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:underline">
                    {t('back', language)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [language, setLanguage] = useState<LanguageType>('en');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('light');

  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', email: '', avatar: '' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [savings, setSavings] = useState<SavingGoal[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>(INITIAL_HOLIDAYS);
  const [metrics, setMetrics] = useState<any[]>(MOCK_METRICS);
  const [savingsPlan, setSavingsPlan] = useState<SavingsPlan>({ bankName: 'DPS - Prime Bank', years: 10, rate: 7.5, amount: 5000 });
  const [salaryConfig, setSalaryConfig] = useState(ADMIN_SALARY_CONFIG);
  const [historyEntries, setHistoryEntries] = useState<SalaryHistoryEntry[]>(ADMIN_HISTORY_ENTRIES);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(INITIAL_LEAVE_RECORDS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [leaveQuotas, setLeaveQuotas] = useState({ cl: 10, ml: 14 });

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncToSupabase = useCallback(async () => {
    if (!currentUser || !isDataLoaded) return;
    
    const content = {
      userProfile, transactions, bills, savings, bets, reminders, 
      holidays, metrics, savingsPlan, salaryConfig, 
      historyEntries, leaveRecords, attendanceRecords, leaveQuotas,
      language, theme, activeView
    };

    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({ 
          id: currentUser.id, 
          content, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });
        
      if (error) {
        console.error("Supabase Sync Error:", error.message);
      }
    } catch (err) {
      console.error("Critical Sync Error:", err);
    }
  }, [
    currentUser, isDataLoaded, userProfile, transactions, bills, savings, 
    bets, reminders, holidays, metrics, savingsPlan, salaryConfig, 
    historyEntries, leaveRecords, attendanceRecords, leaveQuotas, 
    language, theme, activeView
  ]);

  const loadFromSupabase = async (user: any) => {
    try {
      const { data, error } = await supabase.from('user_data').select('content').eq('id', user.id).single();
      
      if (data?.content) {
        const c = data.content;
        setUserProfile(c.userProfile || { name: user.user_metadata?.full_name || '', email: user.email, avatar: `https://picsum.photos/200/200?seed=${user.id}` });
        setTransactions(c.transactions || []);
        setBills(c.bills || []);
        setSavings(c.savings || []);
        setBets(c.bets || []);
        setReminders(c.reminders || []);
        setHolidays(c.holidays || INITIAL_HOLIDAYS);
        setMetrics(c.metrics || MOCK_METRICS);
        setSavingsPlan(c.savingsPlan || { bankName: 'DPS - Prime Bank', years: 10, rate: 7.5, amount: 5000 });
        setSalaryConfig(c.salaryConfig || ADMIN_SALARY_CONFIG);
        setHistoryEntries(c.historyEntries || ADMIN_HISTORY_ENTRIES);
        setLeaveRecords(c.leaveRecords || INITIAL_LEAVE_RECORDS);
        setAttendanceRecords(c.attendanceRecords || INITIAL_ATTENDANCE);
        setLeaveQuotas(c.leaveQuotas || { cl: 10, ml: 14 });
        if (c.language) setLanguage(c.language);
        if (c.theme) setTheme(c.theme);
        if (c.activeView) setActiveView(c.activeView);
      } else {
        const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setUserProfile({ name: user.user_metadata?.full_name || 'Finance User', email: user.email, avatar: `https://picsum.photos/200/200?seed=${user.id}` });
        if (isAdmin) {
          setTransactions(MOCK_TRANSACTIONS);
          setBills(MOCK_BILLS);
          setSavings(MOCK_SAVINGS);
          setBets(MOCK_BETS);
          setReminders(MOCK_REMINDERS);
          setSalaryConfig(ADMIN_SALARY_CONFIG);
          setHistoryEntries(ADMIN_HISTORY_ENTRIES);
        }
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
        loadFromSupabase(session.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
        if (!isDataLoaded) loadFromSupabase(session.user);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsDataLoaded(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncToSupabase();
      }, 1000); 
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [
    userProfile, transactions, bills, savings, bets, reminders, 
    holidays, metrics, savingsPlan, salaryConfig, 
    historyEntries, leaveRecords, attendanceRecords, leaveQuotas,
    language, theme, activeView, syncToSupabase, isDataLoaded
  ]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    loadFromSupabase(user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsDataLoaded(false);
    setActiveView('dashboard');
  };

  const updateNetWorth = (updatedTransactions: Transaction[]) => {
    const totalBalance = updatedTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    setMetrics(prev => prev.map(m => m.label === 'Net Worth' ? { ...m, value: totalBalance } : m));
  };

  const handleAddTransaction = (newT: Transaction) => { const updated = [...transactions, newT]; setTransactions(updated); updateNetWorth(updated); };
  const handleUpdateTransaction = (updatedT: Transaction) => { const updated = transactions.map(t => t.id === updatedT.id ? updatedT : t); setTransactions(updated); updateNetWorth(updated); };
  const handleTransactionDelete = (id: string) => { const updated = transactions.filter(t => t.id !== id); setTransactions(updated); updateNetWorth(updated); };
  const handleTransactionsBulkDelete = (ids: string[]) => { const updated = transactions.filter(t => !ids.includes(t.id)); setTransactions(updated); updateNetWorth(updated); };
  const handleAddBill = (newBill: Bill) => { setBills([...bills, newBill]); handleAddTransaction({ id: `tx-bill-${newBill.id}`, type: 'expense', category: 'Bill', amount: newBill.amount, date: newBill.dueDate, description: newBill.name }); };
  const handleUpdateBill = (updatedBill: Bill) => { setBills(bills.map(b => b.id === updatedBill.id ? updatedBill : b)); handleUpdateTransaction({ id: `tx-bill-${updatedBill.id}`, type: 'expense', category: 'Bill', amount: updatedBill.amount, date: updatedBill.dueDate, description: updatedBill.name }); };
  const handleDeleteBill = (id: string) => { setBills(bills.filter(b => b.id !== id)); handleTransactionDelete(`tx-bill-${id}`); };
  const handleAddBet = (newBet: Bet) => setBets([...bets, newBet]);
  const handleUpdateBet = (updatedBet: Bet) => setBets(bets.map(b => b.id === updatedBet.id ? updatedBet : b));
  const handleDeleteBet = (id: string) => setBets(bets.filter(b => b.id !== id));
  const handleAddReminder = (newR: Reminder) => setReminders([...reminders, newR]);
  const handleUpdateReminder = (updatedR: Reminder) => setReminders(reminders.map(r => r.id === updatedR.id ? updatedR : r));
  const handleDeleteReminder = (id: string) => setReminders(reminders.filter(r => r.id !== id));
  const handleToggleReminder = (id: string) => setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  const handleAddHoliday = (h: Holiday) => setHolidays([...holidays, h]);
  const handleDeleteHoliday = (id: string) => setHolidays(holidays.filter(h => h.id !== id));

  const navItems = [
    { id: 'dashboard', label: t('dashboard', language), icon: <ICONS.Dashboard /> },
    { id: 'financial', label: t('financial', language), icon: <ICONS.Financial /> },
    { id: 'payroll', label: t('payroll', language), icon: <ICONS.Payroll /> },
    { id: 'savings', label: t('savings', language), icon: <ICONS.Savings /> },
    { id: 'bills', label: t('bills', language), icon: <ICONS.Bills /> },
    { id: 'betting', label: t('betting', language), icon: <ICONS.Betting /> },
    { id: 'reminders', label: t('reminders', language), icon: <ICONS.Reminders /> },
    { id: 'settings', label: t('settings', language), icon: <ICONS.Settings /> },
  ];

  if (!isAuthenticated) { 
    return <LoginView onLogin={handleLogin} language={language} />; 
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return ( <DashboardView metrics={metrics} bills={bills} savings={savings} transactions={transactions} savingsPlan={savingsPlan} reminders={reminders} holidays={holidays} onAddHoliday={handleAddHoliday} onDeleteHoliday={handleDeleteHoliday} /> );
      case 'financial': return ( <FinancialInfoView transactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleTransactionDelete} onUpdateTransaction={handleUpdateTransaction} /> );
      case 'history': return ( <FinancialInfoView transactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleTransactionDelete} onUpdateTransaction={handleUpdateTransaction} isHistoryOnly={true} /> );
      case 'payroll': return ( <PayrollView salaryConfig={salaryConfig} setSalaryConfig={setSalaryConfig} historyEntries={historyEntries} setHistoryEntries={setHistoryEntries} leaveRecords={leaveRecords} setLeaveRecords={setLeaveRecords} attendanceRecords={attendanceRecords} setAttendanceRecords={setAttendanceRecords} leaveQuotas={leaveQuotas} setLeaveQuotas={setLeaveQuotas} /> );
      case 'savings': return ( <SavingsView savings={savings} transactions={transactions} savingsPlan={savingsPlan} onUpdatePlan={setSavingsPlan} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleTransactionDelete} onDeleteTransactions={handleTransactionsBulkDelete} onUpdateTransaction={handleUpdateTransaction} /> );
      case 'bills': return ( <BillsView bills={bills} onAddBill={handleAddBill} onUpdateBill={handleUpdateBill} onDeleteBill={handleDeleteBill} /> );
      case 'betting': return ( <BettingView bets={bets} onAddBet={handleAddBet} onUpdateBet={handleUpdateBet} onDeleteBet={handleDeleteBet} /> );
      case 'reminders': return ( <RemindersView reminders={reminders} onAddReminder={handleAddReminder} onUpdateReminder={handleUpdateReminder} onDeleteReminder={handleDeleteReminder} onToggleReminder={handleToggleReminder} /> );
      case 'settings': return ( <SettingsView currentUserId={currentUser?.id} userProfile={userProfile} setUserProfile={setUserProfile} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} onLogout={handleLogout} allData={{ transactions, bills, savings, bets, reminders, holidays, salaryConfig, historyEntries, leaveRecords, attendanceRecords, leaveQuotas }} /> );
      default: return null;
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 lg:relative lg:translate-x-0 lg:flex lg:flex-col lg:h-full lg:flex-none ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col p-6 overflow-hidden">
          <div className="flex-none flex items-center space-x-2 text-blue-600 mb-8 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">F</div>
            <span className="text-2xl font-black text-slate-800 dark:text-white">Finance Hub</span>
          </div>
          <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
            {navItems.map(item => (
              <SidebarItem key={item.id} id={item.id as ViewType} label={item.label} icon={item.icon} active={activeView === item.id} onClick={() => { setActiveView(item.id as ViewType); setIsSidebarOpen(false); }} />
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <SidebarItem id="logout" label={t('logout', language)} icon={<ICONS.Logout />} active={false} onClick={handleLogout} />
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="flex-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-2 lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="18" y1="18" y2="18"/></svg></button>
            <h2 className="text-base sm:text-2xl font-extrabold text-slate-800 dark:text-white capitalize">{activeView.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
              {theme === 'dark' ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
            </button>
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Welcome</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{userProfile.name}</span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 overflow-hidden cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveView('settings')}><img src={userProfile.avatar} alt="profile" className="object-cover w-full h-full" /></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-6 lg:p-10 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto w-full">{renderView()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() { return <AppContent />; }
