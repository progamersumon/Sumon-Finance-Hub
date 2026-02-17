import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Wallet, Calendar, Clock, CheckCircle2, ChevronRight, 
  TrendingUp, History, Plus, Trash2, AlertTriangle, Briefcase, 
  Home, HeartPulse, Car, Utensils, Zap, Coffee, Trophy, Moon, Star,
  LayoutGrid, Pencil, Save, Send, CalendarDays, KeyRound, ShieldCheck
} from 'lucide-react';
import { Transaction, UserProfile, LanguageType, Holiday } from './types';
import { Modal, Card, DeleteButton } from './components';

export interface SalaryHistoryEntry {
  id: string;
  year: string;
  label: string;
  increasePercent: number;
  amountAdd: number;
  total: number;
  baseDeduction?: number;
}

export interface LeaveRecord {
  id: string;
  type: 'CL' | 'ML';
  reason: string;
  startDate: string;
  endDate: string;
  days: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  inTime: string;
  outTime: string;
  type: 'Standard' | 'Holiday' | 'Off Day';
  status: 'PRESENT' | 'ABSENT' | 'Holiday' | 'Off Day';
  isLate: boolean;
  hasTiffin: boolean;
}

export const DEFAULT_BASE_DEDUCTION = 2450;
export const INITIAL_LEAVE_RECORDS: LeaveRecord[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

interface PayrollViewProps {
  salaryConfig: any;
  setSalaryConfig: (c: any) => void;
  historyEntries: SalaryHistoryEntry[];
  setHistoryEntries: (e: any) => void;
  leaveRecords: LeaveRecord[];
  setLeaveRecords: (l: any) => void;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: (a: any) => void;
  leaveQuotas: { cl: number; ml: number };
  setLeaveQuotas: (q: { cl: number; ml: number }) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ 
  salaryConfig, setSalaryConfig, historyEntries, setHistoryEntries,
  leaveRecords, setLeaveRecords, attendanceRecords, setAttendanceRecords,
  leaveQuotas, setLeaveQuotas
}) => {
  const [activeTab, setActiveTab] = useState<'Pay Slip' | 'Salary' | 'Leave' | 'Attendance'>('Pay Slip');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const tabs = ['Pay Slip', 'Salary', 'Leave', 'Attendance'] as const;

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex gap-1 min-w-max sm:grid sm:grid-cols-4">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 px-6 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{tab}</button>
          ))}
        </div>
      </div>

      {activeTab === 'Pay Slip' && (
        <PaySlipSection salaryConfig={salaryConfig} setSalaryConfig={setSalaryConfig} />
      )}
      {activeTab === 'Salary' && (
        <SalaryHistorySection entries={historyEntries} setEntries={setHistoryEntries} baseDeduction={DEFAULT_BASE_DEDUCTION} />
      )}
      {activeTab === 'Leave' && (
        <LeaveSection records={leaveRecords} setRecords={setLeaveRecords} quotas={leaveQuotas} setQuotas={setLeaveQuotas} year={selectedYear} setYear={setSelectedYear} />
      )}
      {activeTab === 'Attendance' && (
        <AttendanceSection records={attendanceRecords} setRecords={setAttendanceRecords} year={selectedYear} setYear={setSelectedYear} month={selectedMonth} setMonth={setSelectedMonth} />
      )}
    </div>
  );
};

const PaySlipSection: React.FC<{ salaryConfig: any, setSalaryConfig: (c: any) => void }> = ({ salaryConfig, setSalaryConfig }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState(salaryConfig);

  const basic = Math.round((salaryConfig.grossSalary - DEFAULT_BASE_DEDUCTION) / 1.5);
  const rent = Math.round(basic / 2);
  const tiffin = (salaryConfig.tiffinDays || 0) * 50;
  const total = basic + rent + (salaryConfig.medical || 0) + (salaryConfig.conveyance || 0) + (salaryConfig.food || 0) + (salaryConfig.attendanceBonus || 0) + tiffin;

  const handleSave = () => { setSalaryConfig(formData); setIsEditModalOpen(false); };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <Card className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600"><Briefcase size={24} /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Gross Salary</p><h3 className="text-2xl font-black text-slate-800 dark:text-white">৳{salaryConfig.grossSalary.toLocaleString()}</h3></div>
        </div>
        <button onClick={() => { setFormData(salaryConfig); setIsEditModalOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Configure</button>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Monthly Breakdown" className="!p-0 overflow-hidden">
          <div className="p-6 space-y-3">
            {[
              { label: 'Basic Salary', value: basic, icon: <Briefcase size={14} />, color: 'blue' },
              { label: 'House Rent', value: rent, icon: <Home size={14} />, color: 'emerald' },
              { label: 'Medical', value: salaryConfig.medical, icon: <HeartPulse size={14} />, color: 'rose' },
              { label: 'Conveyance', value: salaryConfig.conveyance, icon: <Car size={14} />, color: 'indigo' },
              { label: 'Food', value: salaryConfig.food, icon: <Utensils size={14} />, color: 'orange' },
              { label: 'Attendance', value: salaryConfig.attendanceBonus, icon: <Star size={14} />, color: 'amber' },
              { label: 'Tiffin Bill', value: tiffin, icon: <Coffee size={14} />, color: 'sky' }
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 border-b last:border-0 dark:border-slate-800">
                <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600`}>{item.icon}</div><span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span></div>
                <span className="text-sm font-black dark:text-white">৳{item.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="mt-4 p-4 rounded-2xl bg-blue-600 text-white flex justify-between items-center shadow-lg shadow-blue-100">
              <div><p className="text-[9px] font-black uppercase opacity-80">Total Monthly</p><h4 className="text-2xl font-black">৳{total.toLocaleString()}</h4></div>
              <ChevronRight size={24} />
            </div>
          </div>
        </Card>
        <Card title="Bonuses & Festivals" className="!p-0 overflow-hidden">
          <div className="p-6 space-y-4">
            {[
              { label: 'Yearly Bonus', value: Math.round(salaryConfig.grossSalary / 1.5), icon: <Trophy size={16} />, color: 'emerald' },
              { label: 'Eid Bonuses (Total)', value: basic * 2, icon: <Moon size={16} />, color: 'indigo' }
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${item.color}-50 text-${item.color}-600`}>{item.icon}</div><span className="text-sm font-black dark:text-white uppercase">{item.label}</span></div>
                <span className="text-lg font-black text-indigo-600">৳{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Salary Configuration">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Gross Salary</label><input type="number" value={formData.grossSalary} onChange={e => setFormData({...formData, grossSalary: Number(e.target.value)})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border outline-none font-bold" /></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Tiffin Days</label><input type="number" value={formData.tiffinDays} onChange={e => setFormData({...formData, tiffinDays: Number(e.target.value)})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border outline-none font-bold" /></div>
          </div>
          <button onClick={handleSave} className="w-full py-4 bg-blue-600 text-white font-black uppercase rounded-xl shadow-lg">Save Configuration</button>
        </div>
      </Modal>
    </div>
  );
};

const SalaryHistorySection: React.FC<{ entries: SalaryHistoryEntry[], setEntries: (e: any) => void, baseDeduction: number }> = ({ entries, setEntries, baseDeduction }) => {
  const sorted = useMemo(() => [...entries].sort((a,b) => b.year.localeCompare(a.year)), [entries]);
  const current = sorted[0]?.total || 0;
  const join = sorted[sorted.length - 1]?.total || 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-xl flex justify-between items-center group overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase opacity-60">Join Salary</p>
            <h3 className="text-2xl font-black">৳{join.toLocaleString()}</h3>
          </div>
          <History size={32} className="opacity-20 relative z-10" />
        </div>
        <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-xl flex justify-between items-center group overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase opacity-60">Current Salary</p>
            <h3 className="text-2xl font-black">৳{current.toLocaleString()}</h3>
          </div>
          <TrendingUp size={32} className="opacity-20 relative z-10" />
        </div>
      </div>
      <Card title="Salary Growth History">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50 dark:bg-slate-800"><th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Year</th><th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">% Increase</th><th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Amount +</th><th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Total</th></tr></thead>
            <tbody className="divide-y dark:divide-slate-800">
              {sorted.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-black dark:text-white">{entry.year}</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">{entry.increasePercent}%</span></td>
                  <td className="px-6 py-4 font-bold text-slate-400">+৳{entry.amountAdd.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-slate-900 dark:text-white">৳{entry.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const LeaveSection: React.FC<{ records: LeaveRecord[], setRecords: (l: any) => void, quotas: any, setQuotas: any, year: string, setYear: (y: string) => void }> = ({ records, setRecords, quotas, year, setYear }) => {
  const filtered = records.filter(r => r.startDate.startsWith(year));
  const clUsed = filtered.filter(r => r.type === 'CL').reduce((s, r) => s + r.days, 0);
  const mlUsed = filtered.filter(r => r.type === 'ML').reduce((s, r) => s + r.days, 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Casual Leave', used: clUsed, total: quotas.cl, color: 'blue' },
          { label: 'Medical Leave', used: mlUsed, total: quotas.ml, color: 'emerald' }
        ].map((q, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className="flex justify-between items-start mb-6"><div><h3 className="text-sm font-black uppercase dark:text-white">{q.label}</h3><p className="text-[10px] font-bold text-slate-400 uppercase">{year} Balance</p></div><CalendarDays size={20} className={`text-${q.color}-500`} /></div>
            <div className="space-y-2"><div className="flex justify-between text-[10px] font-black uppercase text-emerald-600"><span>{q.total - q.used} Days Available</span><span>{Math.round((q.used/q.total)*100)}% Used</span></div><div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden"><div className={`h-full bg-${q.color === 'blue' ? 'blue-600' : 'emerald-600'} transition-all`} style={{ width: `${Math.min(100, (q.used/q.total)*100)}%` }} /></div></div>
          </Card>
        ))}
      </div>
      <Card title="Leave Logs">
        <div className="space-y-3">
          {filtered.length > 0 ? filtered.map(r => (
            <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${r.type === 'CL' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{r.type}</div><div><h5 className="text-sm font-black dark:text-white uppercase">{r.reason}</h5><p className="text-[10px] text-slate-400 font-bold uppercase">{r.startDate} to {r.endDate}</p></div></div>
              <span className="text-xs font-black text-indigo-600 uppercase">{r.days} Days</span>
            </div>
          )) : <div className="py-10 text-center text-slate-300 italic text-sm">No leave records for {year}</div>}
        </div>
      </Card>
    </div>
  );
};

const AttendanceSection: React.FC<{ records: AttendanceRecord[], setRecords: (a: any) => void, year: string, setYear: (y: string) => void, month: string, setMonth: (m: string) => void }> = ({ records, year, month, setMonth }) => {
  const filtered = records.filter(r => r.date.startsWith(year) && (month === 'all' || r.date.split('-')[1] === month));
  
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-slate-900 border p-4 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Present', val: filtered.filter(r => r.status === 'PRESENT').length, col: 'emerald' },
          { label: 'Absent', val: filtered.filter(r => r.status === 'ABSENT').length, col: 'rose' },
          { label: 'Late', val: filtered.filter(r => r.isLate).length, col: 'amber' },
          { label: 'Tiffin', val: filtered.filter(r => r.hasTiffin).length, col: 'indigo' }
        ].map(s => (
          <div key={s.label} className={`bg-${s.col}-50 dark:bg-${s.col}-900/10 p-4 rounded-xl border border-${s.col}-100 dark:border-slate-800`}><p className="text-[9px] font-black uppercase text-slate-400 mb-1">{s.label}</p><h4 className={`text-2xl font-black text-${s.col}-600`}>{s.val}</h4></div>
        ))}
      </div>
      <Card title="Attendance History">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50 dark:bg-slate-800"><th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Date</th><th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Check In/Out</th><th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Status</th></tr></thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4"><span className="text-xs font-black dark:text-white uppercase">{r.date}</span></td>
                  <td className="px-6 py-4"><div className="flex gap-2 text-[10px] font-bold"><span className="px-2 py-0.5 bg-slate-100 rounded">{r.inTime || '--:--'}</span><span className="text-slate-300">→</span><span className="px-2 py-0.5 bg-slate-100 rounded">{r.outTime || '--:--'}</span></div></td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${r.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
