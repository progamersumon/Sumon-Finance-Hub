
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from './types';
import { ICONS } from './constants';
import { formatDate, formatTo12Hr } from './utils';
import { Card, Modal, DeleteButton } from './components';

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

export const INITIAL_LEAVE_RECORDS: LeaveRecord[] = [
  { id: '1', type: 'CL', reason: 'Family Problem', startDate: '2023-02-01', endDate: '2023-02-02', days: 2 },
  { id: '2', type: 'CL', reason: 'Family Problem', startDate: '2023-02-04', endDate: '2023-02-04', days: 1 },
  { id: '10', type: 'ML', reason: 'Sick Leave', startDate: '2025-04-06', endDate: '2025-04-06', days: 1 },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', date: '2026-01-01', inTime: '08:15', outTime: '19:30', type: 'Standard', status: 'PRESENT', isLate: true, hasTiffin: true },
  { id: 'a4', date: '2026-01-04', inTime: '', outTime: '', type: 'Off Day', status: 'Off Day', isLate: false, hasTiffin: false },
];

interface PayrollViewProps {
  salaryConfig: any;
  setSalaryConfig: (c: any) => void;
  historyEntries: SalaryHistoryEntry[];
  setHistoryEntries: (e: SalaryHistoryEntry[] | ((prev: SalaryHistoryEntry[]) => SalaryHistoryEntry[])) => void;
  leaveRecords: LeaveRecord[];
  setLeaveRecords: (l: LeaveRecord[] | ((prev: LeaveRecord[]) => LeaveRecord[])) => void;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: (a: AttendanceRecord[] | ((prev: AttendanceRecord[]) => AttendanceRecord[])) => void;
  leaveQuotas: { cl: number; ml: number };
  setLeaveQuotas: (q: { cl: number; ml: number }) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ 
  salaryConfig, setSalaryConfig, historyEntries, setHistoryEntries,
  leaveRecords, setLeaveRecords, attendanceRecords, setAttendanceRecords,
  leaveQuotas, setLeaveQuotas
}) => {
  const [activePayrollSubView, setActivePayrollSubView] = useState('Pay Slip');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());

  const [entryToDelete, setEntryToDelete] = useState<SalaryHistoryEntry | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveRecord | null>(null);
  const [attendanceToDelete, setAttendanceToDelete] = useState<AttendanceRecord | null>(null);
  
  const [editingLeave, setEditingLeave] = useState<LeaveRecord | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState<Partial<LeaveRecord>>({
    type: 'CL', reason: '', startDate: '', endDate: '', days: 1
  });

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [attendanceFormData, setAttendanceFormData] = useState<Partial<AttendanceRecord & { dates: string[] }>>({
    date: new Date().toISOString().split('T')[0], dates: [], inTime: '', outTime: '', type: 'Standard'
  });

  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  
  const [editFormData, setEditFormData] = useState(salaryConfig);
  const [historyFormData, setHistoryFormData] = useState({ year: '', baseDeduction: '2450', increasePercent: '', amountAdd: '', total: '' });

  const payrollSubOptions = ['Pay Slip', 'Salary', 'Leave', 'Attendance'];

  // Calculations
  const basicSalary = Math.round((salaryConfig.grossSalary - DEFAULT_BASE_DEDUCTION) / 1.5);
  const houseRent = Math.round(basicSalary / 2);
  const tiffinBillAmount = (salaryConfig.tiffinDays || 0) * 50;
  const totalMonthly = basicSalary + houseRent + (salaryConfig.medical || 0) + (salaryConfig.conveyance || 0) + (salaryConfig.food || 0) + (salaryConfig.attendanceBonus || 0) + tiffinBillAmount;
  const yearlyBonus = Math.round(salaryConfig.grossSalary / 1.5);
  const eidFitr = basicSalary;
  const eidAdha = basicSalary;
  const totalYearlyBonus = yearlyBonus + eidFitr + eidAdha;

  const sortedHistory = useMemo(() => [...historyEntries].sort((a, b) => b.year.localeCompare(a.year)), [historyEntries]);
  const currentSalary = useMemo(() => sortedHistory.length > 0 ? sortedHistory[0].total : salaryConfig.grossSalary, [sortedHistory, salaryConfig.grossSalary]);

  // Update last saved whenever important states change
  useEffect(() => {
    setLastSaved(new Date().toLocaleTimeString());
  }, [salaryConfig, historyEntries, leaveRecords, attendanceRecords]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Premium Header with Sync Status */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ICONS.Payroll className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">System Logs</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active • Last Updated {lastSaved}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
          {payrollSubOptions.map(opt => (
            <button key={opt} onClick={() => setActivePayrollSubView(opt)} className={`px-5 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 whitespace-nowrap uppercase tracking-widest ${activePayrollSubView === opt ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>{opt}</button>
          ))}
        </div>
      </div>

      {activePayrollSubView === 'Pay Slip' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Breakdown Card - Ultra Compact */}
            <Card title="Monthly Breakdown" className="dark:bg-slate-900 border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
              <div className="space-y-0.5 mb-6">
                {[
                  { label: 'Basic Salary', value: basicSalary },
                  { label: 'House Rent', value: houseRent },
                  { label: 'Medical', value: salaryConfig.medical },
                  { label: 'Conveyance', value: salaryConfig.conveyance },
                  { label: 'Food', value: salaryConfig.food },
                  { label: 'Atten. Bonus', value: salaryConfig.attendanceBonus },
                  { label: `Tiffin (${salaryConfig.tiffinDays}d)`, value: tiffinBillAmount }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                    <div className="flex items-center gap-2.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 group-hover:bg-blue-500 transition-colors"></div>
                       <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{item.label}</span>
                    </div>
                    <span className="text-[12px] font-black text-slate-800 dark:text-white bg-slate-100/50 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-50 dark:border-slate-700 shadow-sm">৳{(item.value || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-[24px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20 flex justify-between items-center border border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-0.5">Total Payable</span>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider">Monthly Gross</span>
                </div>
                <span className="text-xl sm:text-2xl font-black drop-shadow-md">৳{totalMonthly.toLocaleString()}</span>
              </div>
            </Card>

            {/* Bonuses Card */}
            <Card title="Bonuses & Festivals" className="dark:bg-slate-900 border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
              <div className="space-y-0.5 mb-6">
                {[
                  { label: 'Yearly Bonus', value: yearlyBonus },
                  { label: 'Eid-ul-Fitr', value: eidFitr },
                  { label: 'Eid-ul-Adha', value: eidAdha }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                    <div className="flex items-center gap-2.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors"></div>
                       <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{item.label}</span>
                    </div>
                    <span className="text-[12px] font-black text-slate-800 dark:text-white bg-slate-100/50 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-50 dark:border-slate-700 shadow-sm">৳{(item.value || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-[24px] bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/20 flex justify-between items-center border border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-0.5">Annual Total</span>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider">Festival Bonus</span>
                </div>
                <span className="text-xl sm:text-2xl font-black drop-shadow-md">৳{totalYearlyBonus.toLocaleString()}</span>
              </div>
            </Card>
          </div>
          
          {/* Quick Edit Config Button */}
          <div className="flex justify-center">
            <button onClick={() => { setEditFormData(salaryConfig); setIsEditModalOpen(true); }} className="px-8 py-4 bg-slate-800 dark:bg-slate-700 text-white font-black rounded-2xl shadow-xl hover:bg-slate-900 dark:hover:bg-slate-600 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-3">
              <ICONS.Edit className="w-4 h-4" />
              Modify Payroll Structure
            </button>
          </div>
        </div>
      )}

      {activePayrollSubView === 'Salary' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           {/* Salary History Logic Same as before but with slightly tighter UI */}
           <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm border-l-8 border-l-slate-400">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Starting Salary</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">৳{(sortedHistory[sortedHistory.length-1]?.total || 0).toLocaleString()}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm border-l-8 border-l-blue-600">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Current Gross</p>
              <h3 className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400">৳{currentSalary.toLocaleString()}</h3>
            </div>
          </div>
          <Card title="Increment History" className="p-0 border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Increase</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Total</th>
                     <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Act</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                   {sortedHistory.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                       <td className="px-6 py-4"><span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{item.year}</span></td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="font-black text-emerald-600 text-[10px] sm:text-xs">+{item.increasePercent.toFixed(1)}%</span>
                           <span className="text-[9px] font-bold text-slate-400">৳{item.amountAdd.toLocaleString()}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4"><span className="font-black text-slate-900 dark:text-white text-sm">৳{item.total.toLocaleString()}</span></td>
                       <td className="px-6 py-4 text-right">
                          <DeleteButton onClick={() => { setEntryToDelete(item); setIsDeleteConfirmOpen(true); }} />
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </Card>
        </div>
      )}

      {activePayrollSubView === 'Leave' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          {/* Leave UI Same logic but with premium status bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-10 -mt-10"></div>
               <div className="relative z-10">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Casual Leave Status</p>
                 <div className="flex items-baseline justify-between mb-4">
                   <h4 className="text-4xl font-black text-slate-800 dark:text-white">{leaveRecords.filter(r => r.type === 'CL' && r.startDate.startsWith(filterYear)).reduce((s,r)=>s+r.days,0)}</h4>
                   <span className="text-xs font-bold text-slate-400">OF {leaveQuotas.cl} DAYS USED</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min(100, (leaveRecords.filter(r => r.type === 'CL' && r.startDate.startsWith(filterYear)).reduce((s,r)=>s+r.days,0) / leaveQuotas.cl) * 100)}%` }}></div>
                 </div>
               </div>
             </div>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-10 -mt-10"></div>
               <div className="relative z-10">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Medical Leave Status</p>
                 <div className="flex items-baseline justify-between mb-4">
                   <h4 className="text-4xl font-black text-slate-800 dark:text-white">{leaveRecords.filter(r => r.type === 'ML' && r.startDate.startsWith(filterYear)).reduce((s,r)=>s+r.days,0)}</h4>
                   <span className="text-xs font-bold text-slate-400">OF {leaveQuotas.ml} DAYS USED</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(100, (leaveRecords.filter(r => r.type === 'ML' && r.startDate.startsWith(filterYear)).reduce((s,r)=>s+r.days,0) / leaveQuotas.ml) * 100)}%` }}></div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {activePayrollSubView === 'Attendance' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-20">
           {/* Attendance Content with updated colors */}
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 p-1 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                 <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Attendance Logs</h4>
                 <div className="flex gap-2">
                   <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs font-black outline-none border-none">
                     <option value="all">All</option>
                     {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {attendanceRecords.filter(r => selectedMonth === 'all' || r.date.split('-')[1] === selectedMonth).sort((a,b)=>b.date.localeCompare(a.date)).map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 dark:text-white text-xs tracking-tight">{formatDate(rec.date)}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{rec.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-black">{rec.inTime || '--:--'}</span>
                            <span className="text-slate-300">→</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-black">{rec.outTime || '--:--'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase ${rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{rec.status}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {/* Reusable Modals (Edit Config, Salary, Leave, Attendance) */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Configuration">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Gross Salary (৳)</label><input type="number" value={editFormData.grossSalary} onChange={(e) => setEditFormData({...editFormData, grossSalary: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm dark:text-white" /></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Medical (৳)</label><input type="number" value={editFormData.medical} onChange={(e) => setEditFormData({...editFormData, medical: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm dark:text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Conveyance (৳)</label><input type="number" value={editFormData.conveyance} onChange={(e) => setEditFormData({...editFormData, conveyance: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm dark:text-white" /></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Food (৳)</label><input type="number" value={editFormData.food} onChange={(e) => setEditFormData({...editFormData, food: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm dark:text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Atten. Bonus (৳)</label><input type="number" value={editFormData.attendanceBonus} onChange={(e) => setEditFormData({...editFormData, attendanceBonus: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm dark:text-white" /></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tiffin (Days)</label><input type="number" value={editFormData.tiffinDays} onChange={(e) => setEditFormData({...editFormData, tiffinDays: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm dark:text-white" /></div>
          </div>
          <button onClick={() => { setSalaryConfig(editFormData); setIsEditModalOpen(false); }} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all mt-4 text-[11px] uppercase tracking-widest">Update Cloud Sync</button>
        </div>
      </Modal>

      {/* Delete Confirmation Unified */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Danger Zone">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </div>
          <p className="text-slate-800 dark:text-white font-bold text-lg tracking-tight">Confirm Permanent Deletion?</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => setIsDeleteConfirmOpen(false)} className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl text-[10px] uppercase tracking-widest">Cancel</button>
            <button onClick={() => {
              if (entryToDelete) setHistoryEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
              setIsDeleteConfirmOpen(false);
            }} className="py-3 px-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg hover:bg-rose-700 text-[10px] uppercase tracking-widest">Yes, Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
