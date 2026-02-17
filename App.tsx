
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewType, Transaction, SavingsGoal, SavingsRecord, Reminder, LanguageType, ThemeType, UserProfile, AppTab, LeaveType, LeaveRecord, PayrollProfile, SalaryHistoryItem } from './types';
import { ICONS } from './constants';
import { 
  MOCK_SAVINGS, 
  MOCK_TRANSACTIONS, MOCK_REMINDERS
} from './mockData';
import Sidebar from './Sidebar';
import Header from './Header';
import { FinancialInfoView } from './FinancialInfoView';
import SavingsView from './SavingsInfoView';
import PayrollView from './PayrollInfoView';
import { DashboardView } from './DashboardView';
import BillsView from './BillInfoView';
import BettingView from './BettingInfoView';
import RemindersView from './RemindersView';
import { SettingsView } from './SettingsView';
import AttendanceView from './AttendanceView';
import LeaveInfoView from './LeaveInfoView';
import { t } from './translations';
import { supabase } from './supabaseClient';

const INITIAL_LEAVE_QUOTAS: LeaveType[] = [
  { id: 'annual', type: 'Annual Leave', total: 20, color: 'bg-blue-600' },
  { id: 'medical', type: 'Medical Leave', total: 14, color: 'bg-rose-500' },
  { id: 'casual', type: 'Casual Leave', total: 10, color: 'bg-amber-500' },
];

const STORAGE_KEY = 'finance_hub_cache';

const FinanceHubLogo = ({ className = "w-48 h-48", textColor = "text-white" }: { className?: string, textColor?: string }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <div className="relative w-28 h-28 flex items-center justify-center mb-3">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <rect x="25" y="45" width="10" height="35" rx="1.5" fill="#60a5fa" />
        <rect x="42" y="30" width="10" height="50" rx="1.5" fill="#3b82f6" />
        <rect x="59" y="15" width="10" height="65" rx="1.5" fill="#1d4ed8" />
        <path d="M10 85 Q 50 85, 90 20" fill="none" stroke="url(#arrowGrad)" strokeWidth="6" strokeLinecap="round" />
        <path d="M90 20 L80 22 L86 32 Z" fill="#fbbf24" />
      </svg>
    </div>
    <h1 className={`${textColor} text-3xl font-black tracking-tighter text-center leading-none whitespace-nowrap`}>Finance Hub</h1>
  </div>
);

const LoginView: React.FC<{ onLogin: (user: any) => void, language: LanguageType }> = ({ onLogin, language }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuthSubmit = async () => {
    setErrorMessage(null);
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
        alert(language === 'bn' ? "অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল চেক করুন।" : "Account created! Please check your email.");
        setMode('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        if (data.user) onLogin(data.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans bg-white">
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-blue-600 to-indigo-800 flex-col items-center justify-center p-10 text-center text-white relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <FinanceHubLogo />
        <p className="mt-8 text-blue-100 font-medium max-w-xs opacity-80 uppercase tracking-widest text-[10px]">Your personal AI-powered financial ecosystem.</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-sm:max-w-xs">
          <div className="flex justify-center mb-10 md:hidden">
             <FinanceHubLogo className="w-32 h-32" textColor="text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-blue-900 mb-6 text-center uppercase tracking-tighter">
            {mode === 'login' ? t('login', language) : t('signUp', language)}
          </h2>
          {errorMessage && <div className="mb-4 p-4 bg-rose-50 text-rose-600 text-xs rounded-2xl font-bold border border-rose-100">{errorMessage}</div>}
          <div className="space-y-4">
            {mode === 'signup' && (
              <input type="text" placeholder={t('fullName', language)} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 px-5 text-slate-900 outline-none focus:border-blue-500 font-bold transition-all" />
            )}
            <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 px-5 text-slate-900 outline-none focus:border-blue-500 font-bold transition-all" />
            <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 px-5 text-slate-900 outline-none focus:border-blue-500 font-bold transition-all" />
            <button onClick={handleAuthSubmit} disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-sm mt-2 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'SUBMIT'}
            </button>
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-xs font-black text-blue-600 uppercase mt-4 hover:text-blue-800 transition-colors">
              {mode === 'login' ? t('signUp', language) : t('alreadyHaveAccount', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [language, setLanguage] = useState<LanguageType>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<AppTab>(AppTab.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('light');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // States
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'User', email: '', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sumon' });
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [reminders, setReminders] = useState<Reminder[]>(MOCK_REMINDERS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(MOCK_SAVINGS);
  const [savingsRecords, setSavingsRecords] = useState<SavingsRecord[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [leaveQuotas, setLeaveQuotas] = useState<LeaveType[]>(INITIAL_LEAVE_QUOTAS);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);
  const [payrollProfile, setPayrollProfile] = useState<PayrollProfile>({
    name: 'Finance User',
    role: 'Product Designer',
    department: 'UI/UX Team',
    employeeId: 'D-8842',
    grossSalary: 35000,
    basicSalary: 21700,
    houseRent: 10850,
    medical: 500,
    conveyance: 500,
    food: 500,
    attendanceBonus: 1000,
    tiffinBillDays: 22,
    tiffinRate: 50,
    yearlyBonus: 23333,
    eidBonus: 21700,
    baseDeduction: 2450,
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sumon'
  });
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryItem[]>([
    { id: '1', year: 2024, inc: 10, amt: 3000, total: 33000 },
    { id: '2', year: 2023, inc: 0, amt: 0, total: 30000 }
  ]);

  const syncToSupabase = useCallback(async (data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Save to LocalStorage as cache immediately
    localStorage.setItem(STORAGE_KEY + '_' + session.user.id, JSON.stringify(data));

    await supabase
      .from('user_data')
      .upsert({ 
        id: session.user.id, 
        content: data,
        updated_at: new Date().toISOString()
      });
  }, []);

  // Initialize data from LocalStorage first, then Supabase in background
  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        const userId = session.user.id;
        
        // 1. Load from LocalStorage Cache for instant UI
        const cached = localStorage.getItem(STORAGE_KEY + '_' + userId);
        if (cached) {
          try {
            const c = JSON.parse(cached);
            applyData(c);
            setIsDataLoaded(true);
          } catch (e) { console.error("Cache corrupted", e); }
        }
        
        // 2. Fetch from Supabase in background
        const { data, error } = await supabase
          .from('user_data')
          .select('content')
          .eq('id', userId)
          .single();

        if (data && data.content) {
          applyData(data.content);
          // Update cache with server data
          localStorage.setItem(STORAGE_KEY + '_' + userId, JSON.stringify(data.content));
        }
        
        const name = session.user.user_metadata?.full_name || 'Finance User';
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
        setUserProfile({ name, email: session.user.email || '', avatar });
        
        setIsDataLoaded(true);
        setIsInitialLoading(false);
      } else {
        setIsInitialLoading(false);
      }
    };

    const applyData = (c: any) => {
      if (c.transactions) setTransactions(c.transactions);
      if (c.reminders) setReminders(c.reminders);
      if (c.savingsGoals) setSavingsGoals(c.savingsGoals);
      if (c.savingsRecords) setSavingsRecords(c.savingsRecords);
      if (c.attendanceList) setAttendanceList(c.attendanceList);
      if (c.leaveQuotas) setLeaveQuotas(c.leaveQuotas);
      if (c.leaveHistory) setLeaveHistory(c.leaveHistory);
      if (c.payrollProfile) setPayrollProfile(c.payrollProfile);
      if (c.salaryHistory) setSalaryHistory(c.salaryHistory);
      if (c.theme) setTheme(c.theme);
      if (c.language) setLanguage(c.language);
    };

    initData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setIsDataLoaded(false);
        // Clean up memory but keep storage for potential re-login
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-Sync Effect
  useEffect(() => {
    if (!isDataLoaded || !isAuthenticated) return;
    
    const timeout = setTimeout(() => {
      const payload = {
        transactions,
        reminders,
        savingsGoals,
        savingsRecords,
        attendanceList,
        leaveQuotas,
        leaveHistory,
        payrollProfile,
        salaryHistory,
        theme,
        language
      };
      syncToSupabase(payload);
    }, 1500); // 1.5s debounce to save network requests

    return () => clearTimeout(timeout);
  }, [
    transactions, reminders, savingsGoals, savingsRecords, 
    attendanceList, leaveQuotas, leaveHistory, 
    payrollProfile, salaryHistory, theme, language, 
    isDataLoaded, isAuthenticated, syncToSupabase
  ]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);

  const handleLogout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      localStorage.removeItem(STORAGE_KEY + '_' + session.user.id);
    }
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const handleAddTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTransactions(prev => [{ id: newId, ...tx }, ...prev]);
    return newId;
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  if (isInitialLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <FinanceHubLogo className="w-32 h-32 animate-pulse" textColor="text-blue-600" />
          <div className="w-10 h-1 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginView onLogin={() => setIsAuthenticated(true)} language={language} />;

  const renderView = () => {
    const commonProps = { language: language === 'bn' ? ('বাংলা' as const) : ('English' as const) };
    
    switch (activeView) {
      case AppTab.DASHBOARD: 
        return <DashboardView {...commonProps} profile={userProfile} transactions={transactions} savingsGoals={savingsGoals} attendanceList={attendanceList} reminders={reminders} />;
      case AppTab.FINANCIAL: 
        return <FinancialInfoView transactions={transactions} onAdd={handleAddTransaction} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />;
      case AppTab.SAVINGS: 
        return (
          <SavingsView 
            goals={savingsGoals} 
            records={savingsRecords} 
            setGoals={setSavingsGoals} 
            setRecords={setSavingsRecords} 
            onAddTransaction={handleAddTransaction} 
            onEditTransaction={handleEditTransaction} 
            onDeleteTransaction={handleDeleteTransaction} 
          />
        );
      case AppTab.SALARY_INFO: 
        return <PayrollView payrollProfile={payrollProfile} setPayrollProfile={setPayrollProfile} salaryHistory={salaryHistory} setSalaryHistory={setSalaryHistory} />;
      case AppTab.ATTENDANCE:
        return <AttendanceView activitiesList={attendanceList} setActivitiesList={setAttendanceList} />;
      case AppTab.LEAVE_INFO:
        return <LeaveInfoView leaveQuotas={leaveQuotas} setLeaveQuotas={setLeaveQuotas} leaveHistory={leaveHistory} setLeaveHistory={setLeaveHistory} />;
      case AppTab.BILL: 
        return <BillsView bills={[]} setBills={() => {}} onAddTransaction={handleAddTransaction} onEditTransaction={handleEditTransaction} onDeleteTransaction={handleDeleteTransaction} />;
      case AppTab.BETTING: 
        return <BettingView records={[]} setRecords={() => {}} onAddTransaction={handleAddTransaction} onEditTransaction={handleEditTransaction} onDeleteTransaction={handleDeleteTransaction} />;
      case AppTab.REMINDERS: 
        return <RemindersView {...commonProps} reminders={reminders} setReminders={setReminders} />;
      case AppTab.SETTINGS: 
        return <SettingsView language={language} setLanguage={setLanguage} profile={{name: userProfile.name, email: userProfile.email, role: payrollProfile.role, imageUrl: userProfile.avatar}} setProfile={setUserProfile} onLogout={handleLogout} theme={theme} setTheme={setTheme} />;
      default: 
        return <DashboardView {...commonProps} profile={userProfile} transactions={transactions} savingsGoals={savingsGoals} attendanceList={attendanceList} reminders={reminders} />;
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      <aside className="hidden lg:flex w-56 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <Sidebar activeTab={activeView} onSelectTab={(tab) => setActiveView(tab)} language={language === 'bn' ? 'বাংলা' : 'English'} onLogout={handleLogout} />
      </aside>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 animate-in slide-in-from-left duration-300">
            <Sidebar activeTab={activeView} onSelectTab={(tab) => { setActiveView(tab); setIsSidebarOpen(false); }} isMobile={true} language={language === 'bn' ? 'বাংলা' : 'English'} onLogout={handleLogout} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeTab={activeView} onOpenMenu={() => setIsSidebarOpen(true)} language={language === 'bn' ? 'বাংলা' : 'English'} profile={{ name: userProfile.name, role: payrollProfile.role, imageUrl: userProfile.avatar }} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() { return <AppContent />; }
