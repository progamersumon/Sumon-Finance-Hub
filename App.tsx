
import React, { useState, useEffect, useRef } from 'react';
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
  { id: 'h1', year: '2018', label: 'Join', increasePercent: 0, amountAdd: 0, total: 14500, baseDeduction: 2450 },
];

const AppContent: React.FC = () => {
  const [language, setLanguage] = useState<LanguageType>('en');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'syncing' | 'error'>('saved');
  
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

  const syncToSupabase = async (force = false) => {
    if (!currentUser || !isDataLoaded) return;
    setSyncStatus('syncing');
    
    const content = {
      userProfile, transactions, bills, savings, bets, reminders, 
      holidays, metrics, savingsPlan, salaryConfig, 
      historyEntries, leaveRecords, attendanceRecords, leaveQuotas,
      language, theme,
      last_updated: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('user_data')
        .upsert(
          { id: currentUser.id, content, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
      
      if (error) throw error;
      setSyncStatus('saved');
    } catch (err) {
      console.error("Cloud Sync Error:", err);
      setSyncStatus('error');
    }
  };

  // Debounced Auto-Sync
  useEffect(() => {
    if (!isDataLoaded || !isAuthenticated) return;
    
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    setSyncStatus('syncing');
    syncTimeoutRef.current = setTimeout(() => {
      syncToSupabase();
    }, 2000); 

    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [
    userProfile, transactions, bills, savings, bets, reminders, 
    holidays, metrics, savingsPlan, salaryConfig, 
    historyEntries, leaveRecords, attendanceRecords, leaveQuotas,
    language, theme
  ]);

  const loadFromSupabase = async (user: any) => {
    try {
      const { data, error } = await supabase.from('user_data').select('content').eq('id', user.id).maybeSingle();
      
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
      } else {
        // Fallback for new users or admin first-time
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
    } catch (e) {
      console.error("Initial load error:", e);
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
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);

  const handleLogout = async () => { await supabase.auth.signOut(); setCurrentUser(null); setIsAuthenticated(false); setIsDataLoaded(false); setActiveView('dashboard'); };
  
  // Navigation
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

  if (!isAuthenticated) return <LoginView onLogin={(user) => { setCurrentUser(user); setIsAuthenticated(true); loadFromSupabase(user); }} language={language} />; 

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 lg:relative lg:translate-x-0 lg:flex lg:flex-col lg:h-full lg:flex-none ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col p-6 overflow-hidden">
          <div className="flex-none flex items-center space-x-2 text-blue-600 mb-8 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">F</div>
            <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Finance Hub</span>
          </div>
          <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
            {navItems.map(item => ( 
              <SidebarItem key={item.id} id={item.id as ViewType} label={item.label} icon={item.icon} active={activeView === item.id} onClick={() => { setActiveView(item.id as ViewType); setIsSidebarOpen(false); }} /> 
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 tracking-widest text-center">Version 2.1.0-Pro</p>
            <SidebarItem id="logout" label={t('logout', language)} icon={<ICONS.Logout />} active={false} onClick={handleLogout} />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="flex-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-2 lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="18" y1="18" y2="18"/></svg>
            </button>
            <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white capitalize tracking-tight">{activeView.replace('-', ' ')}</h2>
            
            <div className="ml-4 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hidden sm:flex">
              {syncStatus === 'syncing' ? (
                <><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Syncing</span></>
              ) : syncStatus === 'error' ? (
                <><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Offline</span></>
              ) : (
                <><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cloud Saved</span></>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95">
              {theme === 'dark' ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-white dark:border-slate-700 overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-100 dark:hover:ring-blue-900/30 transition-all" onClick={() => setActiveView('settings')}>
              <img src={userProfile.avatar} alt="profile" className="object-cover w-full h-full" />
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-6 lg:p-10 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto w-full">
            {activeView === 'dashboard' && <DashboardView metrics={metrics} bills={bills} savings={savings} transactions={transactions} savingsPlan={savingsPlan} reminders={reminders} holidays={holidays} onAddHoliday={(h) => setHolidays([...holidays, h])} onDeleteHoliday={(id) => setHolidays(holidays.filter(h => h.id !== id))} />}
            {activeView === 'financial' && <FinancialInfoView transactions={transactions} onAddTransaction={(t) => setTransactions([...transactions, t])} onDeleteTransaction={(id) => setTransactions(transactions.filter(t => t.id !== id))} onUpdateTransaction={(updated) => setTransactions(transactions.map(t => t.id === updated.id ? updated : t))} />}
            {activeView === 'payroll' && <PayrollView salaryConfig={salaryConfig} setSalaryConfig={setSalaryConfig} historyEntries={historyEntries} setHistoryEntries={setHistoryEntries} leaveRecords={leaveRecords} setLeaveRecords={setLeaveRecords} attendanceRecords={attendanceRecords} setAttendanceRecords={setAttendanceRecords} leaveQuotas={leaveQuotas} setLeaveQuotas={setLeaveQuotas} />}
            {activeView === 'savings' && <SavingsView savings={savings} transactions={transactions} savingsPlan={savingsPlan} onUpdatePlan={setSavingsPlan} onAddTransaction={(t) => setTransactions([...transactions, t])} onDeleteTransaction={(id) => setTransactions(transactions.filter(t => t.id !== id))} onDeleteTransactions={(ids) => setTransactions(transactions.filter(t => !ids.includes(t.id)))} onUpdateTransaction={(u) => setTransactions(transactions.map(t => t.id === u.id ? u : t))} />}
            {activeView === 'bills' && <BillsView bills={bills} onAddBill={(b) => setBills([...bills, b])} onUpdateBill={(b) => setBills(bills.map(item => item.id === b.id ? b : item))} onDeleteBill={(id) => setBills(bills.filter(b => b.id !== id))} />}
            {activeView === 'betting' && <BettingView bets={bets} onAddBet={(b) => setBets([...bets, b])} onUpdateBet={(b) => setBets(bets.map(item => item.id === b.id ? b : item))} onDeleteBet={(id) => setBets(bets.filter(b => b.id !== id))} />}
            {activeView === 'reminders' && <RemindersView reminders={reminders} onAddReminder={(r) => setReminders([...reminders, r])} onUpdateReminder={(r) => setReminders(reminders.map(item => item.id === r.id ? r : item))} onDeleteReminder={(id) => setReminders(reminders.filter(r => r.id !== id))} onToggleReminder={(id) => setReminders(reminders.map(r => r.id === id ? {...r, completed: !r.completed} : r))} />}
            {activeView === 'settings' && <SettingsView currentUserId={currentUser?.id} userProfile={userProfile} setUserProfile={setUserProfile} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} onLogout={handleLogout} allData={{ transactions, bills, savings, bets, reminders, holidays, salaryConfig, historyEntries, leaveRecords, attendanceRecords, leaveQuotas }} />}
          </div>
        </main>
      </div>
    </div>
  );
};

const LoginView: React.FC<{ onLogin: (user: any) => void, language: LanguageType }> = ({ onLogin, language }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true); setErr(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    else if (data.user) onLogin(data.user);
    setLoading(false);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm space-y-6 animate-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-lg mb-4">F</div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">FINANCE HUB PRO</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sign in to sync your data</p>
        </div>
        {err && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100">{err}</div>}
        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm" />
          <button onClick={handleLogin} disabled={loading} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'CONNECTING...' : 'LOGIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() { return <AppContent />; }
