
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewType, Transaction, SavingsGoal, SavingsRecord, Reminder, LanguageType, ThemeType, UserProfile, AppTab, LeaveType, LeaveRecord, PayrollProfile, SalaryHistoryItem, BillRecord, BettingRecord } from './types';
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
import { Mail, Lock, ChevronRight, ArrowLeft, KeyRound, Smartphone } from 'lucide-react';

const INITIAL_LEAVE_QUOTAS: LeaveType[] = [
  { id: 'annual', type: 'Annual Leave', total: 20, color: 'bg-blue-600' },
  { id: 'medical', type: 'Medical Leave', total: 14, color: 'bg-rose-500' },
  { id: 'casual', type: 'Casual Leave', total: 10, color: 'bg-amber-500' },
];

const CACHE_KEY = 'finance_hub_data_cache';

const LoginView: React.FC<{ onLogin: (user: any) => void, language: LanguageType }> = ({ onLogin, language }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_p1' | 'forgot_p2'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', otp: '' });
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

  const handleForgotStep1 = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage(t('fillAllFields', language));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
      if (error) throw error;
      setMode('forgot_p2');
      alert(t('otpSent', language));
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async () => {
    if (!formData.otp.trim()) {
      setErrorMessage(language === 'bn' ? "ওটিপি দিন" : "Enter OTP");
      return;
    }
    setLoading(true);
    try {
      // Step A: Verify the OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: formData.otp,
        type: 'recovery'
      });
      if (verifyError) throw verifyError;

      // Step B: Update the password now that we have a session
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });
      if (updateError) throw updateError;

      alert(t('passwordResetSuccess', language));
      setMode('login');
      setFormData({ ...formData, password: '', otp: '' });
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans bg-white selection:bg-blue-100">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px white inset !important;
          -webkit-text-fill-color: #334155 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#0088ff] to-[#0077ee] flex-col items-center justify-center p-12 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="max-w-xl space-y-0 relative z-10">
          <h1 className="text-[30px] font-medium text-blue-50/90 leading-relaxed mx-auto whitespace-nowrap">Hello User,</h1>
          <h1 className="text-6xl font-black tracking-tight leading-none drop-shadow-sm">Welcome Back!</h1>
          <p className="text-[14px] font-medium text-blue-50/90 leading-relaxed mx-auto whitespace-nowrap pt-6">
            Keep your data organized using our AI-powered<br />management dashboard and tracking system.
          </p>
          
          <div className="pt-8 flex items-center justify-center gap-2">
            <div className="w-12 h-1 bg-blue-300/40 rounded-full" />
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <div className="w-12 h-1 bg-blue-300/40 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white animate-in fade-in duration-500">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h2 className="text-[42px] font-black text-[#0088ff] uppercase tracking-tight leading-none mb-3">
              {mode === 'login' && 'User Login'}
              {mode === 'signup' && 'Sign Up'}
              {(mode === 'forgot_p1' || mode === 'forgot_p2') && 'Reset Access'}
            </h2>
            <div className="w-16 h-1.5 bg-[#0088ff] mx-auto rounded-full" />
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-xs rounded-2xl font-bold border border-rose-100 animate-in shake duration-300">
              {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            {mode === 'signup' && (
              <div className="relative">
                <label className="absolute -top-2.5 left-6 px-2 bg-white text-[#0088ff] text-[10px] font-black uppercase tracking-widest z-10">Full Name</label>
                <div className="flex items-center bg-white border border-blue-200 rounded-full px-6 py-3.5 focus-within:border-[#0088ff] focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                  <User className="text-blue-300 mr-3 shrink-0" size={18} />
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-white text-slate-700 font-bold outline-none text-sm placeholder:text-slate-300" 
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot_p2' && (
              <>
                <div className="relative">
                  <label className="absolute -top-2.5 left-6 px-2 bg-white text-[#0088ff] text-[10px] font-black uppercase tracking-widest z-10">
                    {mode === 'forgot_p1' ? 'Enter Account Email' : 'Email Id'}
                  </label>
                  <div className="flex items-center bg-white border border-blue-200 rounded-full px-6 py-3.5 focus-within:border-[#0088ff] focus-within:ring-4 focus-within:ring-blue-50 transition-all group">
                    <Mail className="text-blue-300 mr-3 shrink-0 group-focus-within:text-[#0088ff] transition-colors" size={18} />
                    <input 
                      type="email" 
                      placeholder="user@example.com" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full bg-white text-slate-700 font-bold outline-none text-sm placeholder:text-slate-300" 
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2.5 left-6 px-2 bg-white text-[#0088ff] text-[10px] font-black uppercase tracking-widest z-10">
                    {mode === 'forgot_p1' ? 'Enter New Password' : 'Password'}
                  </label>
                  <div className="flex items-center bg-white border border-blue-200 rounded-full px-6 py-3.5 focus-within:border-[#0088ff] focus-within:ring-4 focus-within:ring-blue-50 transition-all group">
                    <Lock className="text-blue-300 mr-3 shrink-0 group-focus-within:text-[#0088ff] transition-colors" size={18} />
                    <input 
                      type="password" 
                      placeholder="••••••••••••••••" 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="w-full bg-white text-slate-700 font-bold outline-none text-sm placeholder:text-slate-300" 
                    />
                  </div>
                  {mode === 'login' && (
                    <div className="flex justify-end mt-1.5">
                      <button 
                        onClick={() => setMode('forgot_p1')}
                        className="text-[10px] font-bold text-slate-400 italic hover:text-[#0088ff] transition-colors"
                      >
                        {t('forgotPassword', language)}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {mode === 'forgot_p2' && (
              <div className="relative animate-in slide-in-from-right duration-300">
                <label className="absolute -top-2.5 left-6 px-2 bg-white text-[#0088ff] text-[10px] font-black uppercase tracking-widest z-10">Verification Code</label>
                <div className="flex items-center bg-white border border-blue-200 rounded-full px-6 py-3.5 focus-within:border-[#0088ff] focus-within:ring-4 focus-within:ring-blue-50 transition-all group">
                  <KeyRound className="text-blue-300 mr-3 shrink-0 group-focus-within:text-[#0088ff] transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={formData.otp} 
                    onChange={e => setFormData({...formData, otp: e.target.value})} 
                    className="w-full bg-white text-slate-700 font-bold outline-none text-sm placeholder:text-slate-300 text-center tracking-[1em] pl-4" 
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold text-center mt-4">OTP sent to: <span className="text-[#0088ff]">{formData.email}</span></p>
              </div>
            )}

            <div className="pt-2">
              <button 
                onClick={
                  mode === 'login' || mode === 'signup' ? handleAuthSubmit : 
                  mode === 'forgot_p1' ? handleForgotStep1 : handleForgotVerify
                } 
                disabled={loading} 
                className="w-full bg-[#0099ff] hover:bg-[#0088ff] text-white font-black py-4 rounded-full shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-sm uppercase tracking-widest">
                      {mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : mode === 'forgot_p1' ? 'Send OTP' : 'Verify & Reset'}
                    </span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2 flex flex-col gap-3">
              {mode === 'forgot_p1' || mode === 'forgot_p2' ? (
                <button 
                  onClick={() => setMode('login')} 
                  className="text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
              ) : (
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
                  className="text-[12px] font-bold text-slate-600 hover:text-[#0088ff] transition-colors"
                >
                  {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const User = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const AppContent: React.FC = () => {
  const [language, setLanguage] = useState<LanguageType>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<AppTab>(AppTab.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('light');
  const [isSyncing, setIsSyncing] = useState(false);

  const mainContentRef = useRef<HTMLDivElement>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'User', email: '', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sumon' });
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [reminders, setReminders] = useState<Reminder[]>(MOCK_REMINDERS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(MOCK_SAVINGS);
  const [savingsRecords, setSavingsRecords] = useState<SavingsRecord[]>([]);
  const [billRecords, setBillRecords] = useState<BillRecord[]>([]);
  const [bettingRecords, setBettingRecords] = useState<BettingRecord[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [leaveQuotas, setLeaveQuotas] = useState<LeaveType[]>(INITIAL_LEAVE_QUOTAS);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);
  const [payrollProfile, setPayrollProfile] = useState<PayrollProfile>({
    name: 'Finance User',
    role: 'Product Designer',
    department: 'UI/UX Team',
    employeeId: 'D-8842',
    grossSalary: 31083,
    basicSalary: 19089,
    houseRent: 9545,
    medical: 750,
    conveyance: 450,
    food: 1250,
    attendanceBonus: 925,
    tiffinBillDays: 25,
    tiffinRate: 50,
    yearlyBonus: 20722,
    eidBonus: 19089,
    baseDeduction: 2450,
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sumon'
  });
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryItem[]>([
    { id: '1', year: 2024, inc: 7, amt: 886, total: 15386 },
    { id: '2', year: 2023, inc: 0, amt: 0, total: 14500 }
  ]);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeView]);

  const loadDataFromCache = useCallback(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const c = JSON.parse(cached);
        if (c.userProfile) setUserProfile(c.userProfile);
        if (c.transactions) setTransactions(c.transactions);
        if (c.reminders) setReminders(c.reminders);
        if (c.savingsGoals) setSavingsGoals(c.savingsGoals);
        if (c.savingsRecords) setSavingsRecords(c.savingsRecords);
        if (c.billRecords) setBillRecords(c.billRecords);
        if (c.bettingRecords) setBettingRecords(c.bettingRecords);
        if (c.attendanceList) setAttendanceList(c.attendanceList);
        if (c.leaveQuotas) setLeaveQuotas(c.leaveQuotas);
        if (c.leaveHistory) setLeaveHistory(c.leaveHistory);
        if (c.payrollProfile) setPayrollProfile(c.payrollProfile);
        if (c.salaryHistory) setSalaryHistory(c.salaryHistory);
        if (c.theme) setTheme(c.theme);
        if (c.language) setLanguage(c.language);
      } catch (e) {
        console.error("Cache parsing error", e);
      }
    }
  }, []);

  const syncToSupabase = useCallback(async (data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    setIsSyncing(true);
    const { error } = await supabase
      .from('user_data')
      .upsert({ 
        id: session.user.id, 
        content: data,
        updated_at: new Date().toISOString()
      });
    
    if (error) console.error("Database Sync Fail:", error.message);
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    loadDataFromCache();

    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setIsSyncing(true);
        const { data } = await supabase
          .from('user_data')
          .select('content')
          .eq('id', session.user.id)
          .single();

        let loadedUserProfile = null;

        if (data && data.content) {
          const c = data.content;
          if (c.userProfile) loadedUserProfile = c.userProfile;
          setTransactions(c.transactions || []);
          setReminders(c.reminders || []);
          setSavingsGoals(c.savingsGoals || []);
          setSavingsRecords(c.savingsRecords || []);
          setBillRecords(c.billRecords || []);
          setBettingRecords(c.bettingRecords || []);
          setAttendanceList(c.attendanceList || []);
          setLeaveQuotas(c.leaveQuotas || INITIAL_LEAVE_QUOTAS);
          setLeaveHistory(c.leaveHistory || []);
          setPayrollProfile(c.payrollProfile || payrollProfile);
          setSalaryHistory(c.salaryHistory || []);
          if (c.theme) setTheme(c.theme);
          if (c.language) setLanguage(c.language);
          
          localStorage.setItem(CACHE_KEY, JSON.stringify(c));
        }
        
        if (loadedUserProfile) {
          setUserProfile(loadedUserProfile);
        } else {
          const name = session.user.user_metadata?.full_name || 'Finance User';
          setUserProfile({ 
            name, 
            email: session.user.email || '', 
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}` 
          });
        }

        setIsSyncing(false);
      }
    };

    initData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem(CACHE_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadDataFromCache]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const timeout = setTimeout(() => {
      syncToSupabase({
        userProfile, 
        transactions, reminders, savingsGoals, savingsRecords, billRecords, bettingRecords,
        attendanceList, leaveQuotas, leaveHistory, payrollProfile, salaryHistory, theme, language
      });
    }, 1000); 

    return () => clearTimeout(timeout);
  }, [
    userProfile, 
    transactions, reminders, savingsGoals, savingsRecords, billRecords, bettingRecords,
    attendanceList, leaveQuotas, leaveHistory, payrollProfile, salaryHistory, theme, language, 
    isAuthenticated, syncToSupabase
  ]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    localStorage.removeItem(CACHE_KEY);
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
        return <BillsView bills={billRecords} setBills={setBillRecords} onAddTransaction={handleAddTransaction} onEditTransaction={handleEditTransaction} onDeleteTransaction={handleDeleteTransaction} />;
      case AppTab.BETTING: 
        return <BettingView records={bettingRecords} setRecords={setBettingRecords} onAddTransaction={handleAddTransaction} onEditTransaction={handleEditTransaction} onDeleteTransaction={handleDeleteTransaction} />;
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
      
      {/* Mobile Sidebar with improved overlay and transition */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-500 transition-transform">
            <Sidebar activeTab={activeView} onSelectTab={(tab) => { setActiveView(tab); setIsSidebarOpen(false); }} isMobile={true} language={language === 'bn' ? 'বাংলা' : 'English'} onLogout={handleLogout} />
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 -right-12 w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shadow-lg border border-slate-100 dark:border-slate-700"
            >
              <ChevronRight size={24} className="rotate-180" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          activeTab={activeView} 
          onOpenMenu={() => setIsSidebarOpen(true)} 
          language={language === 'bn' ? 'বাংলা' : 'English'} 
          profile={{ name: userProfile.name, role: payrollProfile.role, imageUrl: userProfile.avatar }} 
          isSyncing={isSyncing} 
          theme={theme}
          setTheme={setTheme}
        />
        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() { return <AppContent />; }
