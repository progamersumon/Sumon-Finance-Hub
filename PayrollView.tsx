
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
  inTime: string; // "HH:mm"
  outTime: string; // "HH:mm"
  type: 'Standard' | 'Holiday' | 'Off Day';
  status: 'PRESENT' | 'ABSENT' | 'Holiday' | 'Off Day';
  isLate: boolean;
  hasTiffin: boolean;
}

export const DEFAULT_BASE_DEDUCTION = 2450;

export const INITIAL_LEAVE_RECORDS: LeaveRecord[] = [
  { id: '1', type: 'CL', reason: 'Family Problem', startDate: '2023-02-01', endDate: '2023-02-02', days: 2 },
  { id: '2', type: 'CL', reason: 'Family Problem', startDate: '2023-02-04', endDate: '2023-02-04', days: 1 },
  { id: '3', type: 'CL', reason: 'Family Problem', startDate: '2023-09-12', endDate: '2023-09-14', days: 3 },
  { id: '4', type: 'CL', reason: 'Family Problem', startDate: '2023-12-11', endDate: '2023-12-13', days: 3 },
  { id: '5', type: 'ML', reason: 'Sick Leave', startDate: '2023-12-19', endDate: '2023-12-19', days: 1 },
  { id: '6', type: 'ML', reason: 'Sick Leave', startDate: '2024-04-27', endDate: '2024-04-27', days: 1 },
  { id: '7', type: 'CL', reason: 'Family Problem', startDate: '2024-09-14', endDate: '2024-09-16', days: 3 },
  { id: '8', type: 'CL', reason: 'Family Problem', startDate: '2024-10-14', endDate: '2024-10-14', days: 1 },
  { id: '9', type: 'CL', reason: 'Family Problem', startDate: '2024-12-03', endDate: '2024-12-05', days: 3 },
  { id: '10', type: 'ML', reason: 'Sick Leave', startDate: '2025-04-06', endDate: '2025-04-06', days: 1 },
  { id: '11', type: 'ML', reason: 'Sick Leave', startDate: '2025-07-01', endDate: '2025-07-01', days: 1 },
  { id: '12', type: 'CL', reason: 'Family Problem', startDate: '2025-09-13', endDate: '2025-09-15', days: 3 },
  { id: '13', type: 'CL', reason: 'Family Problem', startDate: '2025-11-11', endDate: '2025-11-13', days: 3 },
  { id: '14', type: 'CL', reason: 'Family Problem', startDate: '2025-12-09', endDate: '2025-12-11', days: 3 },
  { id: '15', type: 'CL', reason: 'Family Problem', startDate: '2025-12-30', endDate: '2025-12-30', days: 1 },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', date: '2026-01-01', inTime: '08:15', outTime: '19:30', type: 'Standard', status: 'PRESENT', isLate: true, hasTiffin: true },
  { id: 'a2', date: '2026-01-02', inTime: '07:45', outTime: '17:00', type: 'Standard', status: 'PRESENT', isLate: false, hasTiffin: false },
  { id: 'a3', date: '2026-01-03', inTime: '08:00', outTime: '', type: 'Standard', status: 'PRESENT', isLate: false, hasTiffin: false },
  { id: 'a4', date: '2026-01-04', inTime: '', outTime: '', type: 'Off Day', status: 'Off Day', isLate: false, hasTiffin: false },
  { id: 'a5', date: '2026-01-05', inTime: '', outTime: '', type: 'Holiday', status: 'Holiday', isLate: false, hasTiffin: false },
  { id: 'a6', date: '2026-01-06', inTime: '', outTime: '', type: 'Standard', status: 'ABSENT', isLate: false, hasTiffin: false },
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
  salaryConfig, 
  setSalaryConfig, 
  historyEntries, 
  setHistoryEntries,
  leaveRecords,
  setLeaveRecords,
  attendanceRecords,
  setAttendanceRecords,
  leaveQuotas,
  setLeaveQuotas
}) => {
  const [activePayrollSubView, setActivePayrollSubView] = useState('Pay Slip');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
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

  useEffect(() => {
    if (leaveFormData.startDate && leaveFormData.endDate) {
      const start = new Date(leaveFormData.startDate);
      const end = new Date(leaveFormData.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (leaveFormData.days !== diffDays) {
          setLeaveFormData(prev => ({ ...prev, days: diffDays > 0 ? diffDays : 1 }));
        }
      }
    }
  }, [leaveFormData.startDate, leaveFormData.endDate, leaveFormData.days]);

  const now = new Date();
  const currentYearStr = now.getFullYear().toString();
  const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');

  const [filterYear, setFilterYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isAllYearsSummaryOpen, setIsAllYearsSummaryOpen] = useState(false);

  const [editFormData, setEditFormData] = useState(salaryConfig);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [prevTotalForCalc, setPrevTotalForCalc] = useState<number>(0);
  const [lastUsedBaseDeduction, setLastUsedBaseDeduction] = useState<number>(DEFAULT_BASE_DEDUCTION);
  const [historyFormData, setHistoryFormData] = useState({ year: '', baseDeduction: DEFAULT_BASE_DEDUCTION.toString(), increasePercent: '', amountAdd: '', total: '' });

  const payrollSubOptions = ['Pay Slip', 'Salary', 'Leave', 'Attendance'];

  const availableYears = useMemo(() => {
    const years = ['2023', '2024', '2025', '2026'];
    const currentYear = new Date().getFullYear().toString();
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b.localeCompare(a));
  }, []);

  const attendanceYears = useMemo(() => {
    const years = Array.from(new Set(attendanceRecords.map(r => r.date.split('-')[0])));
    const currentYear = new Date().getFullYear().toString();
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b.localeCompare(a));
  }, [attendanceRecords]);

  const filteredLeaves = useMemo(() => {
    return leaveRecords.filter(rec => rec.startDate.split('-')[0] === filterYear);
  }, [filterYear, leaveRecords]);

  const clLeaves = useMemo(() => filteredLeaves.filter(l => l.type === 'CL'), [filteredLeaves]);
  const mlLeaves = useMemo(() => filteredLeaves.filter(l => l.type === 'ML'), [filteredLeaves]);

  const leaveSummary = useMemo(() => {
    const casualUsed = clLeaves.reduce((sum, l) => sum + l.days, 0);
    const medicalUsed = mlLeaves.reduce((sum, l) => sum + l.days, 0);
    return {
      casual: { used: casualUsed, total: leaveQuotas.cl },
      medical: { used: medicalUsed, total: leaveQuotas.ml }
    };
  }, [clLeaves, mlLeaves, leaveQuotas]);

  const allYearsSummary = useMemo(() => {
    return availableYears.map(year => {
      const yearLeaves = leaveRecords.filter(rec => rec.startDate.split('-')[0] === year);
      const cl = yearLeaves.filter(l => l.type === 'CL').reduce((sum, l) => sum + l.days, 0);
      const ml = yearLeaves.filter(l => l.type === 'ML').reduce((sum, l) => sum + l.days, 0);
      return { year, cl, ml };
    });
  }, [availableYears, leaveRecords]);

  const attendanceStats = useMemo(() => {
    const periodRecords = attendanceRecords.filter(r => {
      const yearMatch = r.date.startsWith(filterYear);
      if (selectedMonth === 'all') return yearMatch;
      return yearMatch && r.date.split('-')[1] === selectedMonth;
    });
    return {
      present: periodRecords.filter(r => r.status === 'PRESENT').length,
      absent: periodRecords.filter(r => r.status === 'ABSENT').length,
      holiday: periodRecords.filter(r => r.status === 'Holiday').length,
      offDay: periodRecords.filter(r => r.status === 'Off Day').length,
      late: periodRecords.filter(r => r.isLate).length,
      tiffin: periodRecords.filter(r => r.hasTiffin).length
    };
  }, [attendanceRecords, filterYear, selectedMonth]);

  const basicSalary = Math.round((salaryConfig.grossSalary - DEFAULT_BASE_DEDUCTION) / 1.5);
  const houseRent = Math.round(basicSalary / 2);
  const tiffinBillAmount = (salaryConfig.tiffinDays || 0) * 50;
  const totalMonthly = basicSalary + houseRent + (salaryConfig.medical || 0) + (salaryConfig.conveyance || 0) + (salaryConfig.food || 0) + (salaryConfig.attendanceBonus || 0) + tiffinBillAmount;
  const yearlyBonus = Math.round(salaryConfig.grossSalary / 1.5);
  const eidFitr = basicSalary;
  const eidAdha = basicSalary;
  const totalYearlyBonus = yearlyBonus + eidFitr + eidAdha;

  const handleEditSave = () => { setSalaryConfig(editFormData); setIsEditModalOpen(false); };
  const sortedHistory = useMemo(() => [...historyEntries].sort((a, b) => b.year.localeCompare(a.year)), [historyEntries]);

  const joinSalary = useMemo(() => sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].total : 0, [sortedHistory]);
  const currentSalary = useMemo(() => sortedHistory.length > 0 ? sortedHistory[0].total : 0, [sortedHistory]);

  const handleUnifiedConfirmDelete = () => {
    if (entryToDelete) {
      setHistoryEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
      setEntryToDelete(null);
    } else if (leaveToDelete) {
      setLeaveRecords(prev => prev.filter(r => r.id !== leaveToDelete.id));
      setLeaveToDelete(null);
    } else if (attendanceToDelete) {
      setAttendanceRecords(prev => prev.filter(r => r.id !== attendanceToDelete.id));
      setAttendanceToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const requestDeleteHistory = (entry: SalaryHistoryEntry) => { 
    setEntryToDelete(entry); 
    setLeaveToDelete(null);
    setAttendanceToDelete(null);
    setIsDeleteConfirmOpen(true); 
  };

  const handleEditHistory = (entry: SalaryHistoryEntry) => {
    const sorted = [...historyEntries].sort((a, b) => a.year.localeCompare(b.year));
    const idx = sorted.findIndex(e => e.id === entry.id);
    const prevEntry = idx > 0 ? sorted[idx - 1] : null;
    setPrevTotalForCalc(prevEntry ? prevEntry.total : 0);
    setEditingHistoryId(entry.id);
    setHistoryFormData({ year: entry.year, baseDeduction: (entry.baseDeduction || lastUsedBaseDeduction).toString(), increasePercent: entry.increasePercent.toString(), amountAdd: entry.amountAdd.toString(), total: entry.total.toString() });
    setIsHistoryModalOpen(true);
  };

  const handleHistoryFieldChange = (field: string, value: string) => {
    const updatedForm = { ...historyFormData, [field]: value };
    if (field === 'increasePercent' || field === 'baseDeduction') {
      const p = parseFloat(updatedForm.increasePercent || '0');
      const d = parseFloat(updatedForm.baseDeduction || '0');
      if (field === 'baseDeduction') { setLastUsedBaseDeduction(d); }
      if (prevTotalForCalc > 0) {
        const amount = Math.round((prevTotalForCalc - d) * (p / 100));
        const total = prevTotalForCalc + amount;
        updatedForm.amountAdd = amount.toString();
        updatedForm.total = total.toString();
      }
    }
    setHistoryFormData(updatedForm);
  };

  const handleSaveHistoryEntry = () => {
    if (!historyFormData.year || !historyFormData.total) return alert("Fill required fields");
    const newEntry: SalaryHistoryEntry = { id: editingHistoryId || Math.random().toString(36).substr(2, 9), year: historyFormData.year, label: '', increasePercent: parseFloat(historyFormData.increasePercent || '0'), amountAdd: parseFloat(historyFormData.amountAdd || '0'), total: parseFloat(historyFormData.total || '0'), baseDeduction: parseFloat(historyFormData.baseDeduction || lastUsedBaseDeduction.toString()) };
    if (editingHistoryId) { setHistoryEntries(prev => prev.map(e => e.id === editingHistoryId ? newEntry : e)); } else { setHistoryEntries(prev => [...prev, newEntry]); }
    setIsHistoryModalOpen(false);
    setEditingHistoryId(null);
  };

  const handleEditLeave = (rec: LeaveRecord) => { setEditingLeave(rec); setLeaveFormData(rec); setIsLeaveModalOpen(true); };
  
  const handleDeleteLeaveRequest = (rec: LeaveRecord) => { 
    setLeaveToDelete(rec); 
    setEntryToDelete(null);
    setAttendanceToDelete(null);
    setIsDeleteConfirmOpen(true); 
  };
  
  const handleSaveLeave = () => {
    if (!leaveFormData.reason || !leaveFormData.startDate || !leaveFormData.endDate) { return alert("Please fill all fields"); }
    const newRec: LeaveRecord = { ...leaveFormData as LeaveRecord, id: editingLeave?.id || Math.random().toString(36).substr(2, 9) };
    if (editingLeave) { setLeaveRecords(prev => prev.map(r => r.id === editingLeave.id ? newRec : r)); } else { setLeaveRecords(prev => [...prev, newRec]); }
    setIsLeaveModalOpen(false);
    setEditingLeave(null);
  };

  const handleEditAttendance = (rec: AttendanceRecord) => { setEditingAttendanceId(rec.id); setAttendanceFormData({ ...rec, dates: [rec.date] }); setIsAttendanceModalOpen(true); };
  
  const handleDeleteAttendanceRequest = (rec: AttendanceRecord) => { 
    setAttendanceToDelete(rec); 
    setEntryToDelete(null);
    setLeaveToDelete(null);
    setIsDeleteConfirmOpen(true); 
  };
  
  const handleSaveAttendance = () => {
    const finalDates = attendanceFormData.type === 'Standard' ? [attendanceFormData.date || ''] : attendanceFormData.dates && attendanceFormData.dates.length > 0 ? attendanceFormData.dates : [attendanceFormData.date || ''];
    if (!finalDates[0]) return alert("Please select at least one date.");
    const newRecords: AttendanceRecord[] = finalDates.map(date => {
      let status: any = attendanceFormData.type;
      let isLate = false;
      let hasTiffin = false;
      if (attendanceFormData.type === 'Standard') {
        if (attendanceFormData.inTime) {
          status = 'PRESENT';
          const inH = parseInt(attendanceFormData.inTime.split(':')[0]);
          const inM = parseInt(attendanceFormData.inTime.split(':')[1]);
          if (inH > 8 || (inH === 8 && inM > 0)) isLate = true;
          if (attendanceFormData.outTime) { const outH = parseInt(attendanceFormData.outTime.split(':')[0]); if (outH >= 19) hasTiffin = true; }
        } else { status = 'ABSENT'; }
      }
      return { id: (editingAttendanceId && finalDates.length === 1) ? editingAttendanceId : Math.random().toString(36).substr(2, 9), date, inTime: attendanceFormData.type === 'Standard' ? (attendanceFormData.inTime || '') : '', outTime: attendanceFormData.type === 'Standard' ? (attendanceFormData.outTime || '') : '', type: attendanceFormData.type as any || 'Standard', status: status, isLate, hasTiffin };
    });
    setAttendanceRecords(prev => {
      const existingIdsToRemove = editingAttendanceId && finalDates.length === 1 ? [editingAttendanceId] : [];
      const filtered = prev.filter(r => !finalDates.includes(r.date) && !existingIdsToRemove.includes(r.id));
      return [...filtered, ...newRecords].sort((a, b) => b.date.localeCompare(a.date));
    });
    setIsAttendanceModalOpen(false);
    setEditingAttendanceId(null);
  };

  const addDateToMultiList = () => {
    if (!attendanceFormData.date) return;
    if (attendanceFormData.dates?.includes(attendanceFormData.date)) return;
    setAttendanceFormData(prev => ({ ...prev, dates: [...(prev.dates || []), prev.date || ''] }));
  };

  const removeDateFromMultiList = (d: string) => {
    setAttendanceFormData(prev => ({ ...prev, dates: prev.dates?.filter(date => date !== d) || [] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar no-scrollbar-mobile">
        <div className="flex gap-1 min-w-[320px] sm:grid sm:grid-cols-4">
          {payrollSubOptions.map(opt => (
            <button key={opt} onClick={() => setActivePayrollSubView(opt)} className={`flex-1 py-2.5 sm:py-3 px-1 rounded-lg text-[10px] sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${activePayrollSubView === opt ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{opt}</button>
          ))}
        </div>
      </div>

      {activePayrollSubView === 'Salary' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-slate-400">
              <p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Join Salary</p>
              <h3 className="text-base sm:text-2xl font-black text-slate-800 dark:text-white">৳{joinSalary.toLocaleString()}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-blue-600">
              <p className="text-[10px] sm:text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Current Salary</p>
              <h3 className="text-base sm:text-2xl font-black text-blue-700 dark:text-blue-400">৳{currentSalary.toLocaleString()}</h3>
            </div>
          </div>
          <Card title="Salary History & Growth Analysis" className="p-2 sm:p-6 dark:bg-slate-900 dark:border-slate-800">
            <div className="overflow-x-visible">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="w-[18%] px-1 sm:px-4 py-3 text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                    <th className="w-[20%] px-1 sm:px-4 py-3 text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">% Inc</th>
                    <th className="w-[22%] px-1 sm:px-4 py-3 text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Amt +</th>
                    <th className="w-[25%] px-1 sm:px-4 py-3 text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="w-[15%] px-1 sm:px-4 py-3 text-[7px] sm:text-[10px] font-black text-slate-400 uppercase text-right">Act</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {sortedHistory.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-1 sm:px-4 py-3"><span className="font-bold text-slate-700 dark:text-slate-300 text-[10px] sm:text-sm">{item.year}</span></td>
                      <td className="px-1 sm:px-4 py-3"><span className={`font-bold text-[10px] sm:text-sm ${item.increasePercent > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{item.increasePercent.toFixed(1)}%</span></td>
                      <td className="px-1 sm:px-4 py-3"><span className={`font-bold text-[9px] sm:text-sm ${item.amountAdd > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>+৳{item.amountAdd.toLocaleString()}</span></td>
                      <td className="px-1 sm:px-4 py-3"><span className="font-black text-slate-800 dark:text-white text-[10px] sm:text-sm">৳{item.total.toLocaleString()}</span></td>
                      <td className="px-1 sm:px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5 sm:gap-2 items-center">
                          <button onClick={() => handleEditHistory(item)} className="p-1.5 sm:p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                          <DeleteButton onClick={() => requestDeleteHistory(item)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <button onClick={() => { setEditingHistoryId(null); const sortedForNext = [...historyEntries].sort((a, b) => a.year.localeCompare(b.year)); const last = sortedForNext[sortedForNext.length - 1]; setPrevTotalForCalc(last ? last.total : 0); setHistoryFormData({ year: (parseInt(last?.year || '2025') + 1).toString(), baseDeduction: lastUsedBaseDeduction.toString(), increasePercent: '', amountAdd: '', total: last ? last.total.toString() : '' }); setIsHistoryModalOpen(true); }} className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 sm:w-16 sm:h-16 bg-slate-800 dark:bg-slate-700 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-light hover:scale-110 active:scale-95 transition-all z-[70] group"><span className="group-hover:rotate-90 transition-transform duration-300">+</span></button>
        </div>
      )}

      {activePayrollSubView === 'Pay Slip' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="bg-white dark:bg-slate-900 px-4 sm:px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
             <div className="flex items-center gap-2 sm:gap-3"><p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Gross Salary</p><h3 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white">৳{salaryConfig.grossSalary.toLocaleString()}</h3></div>
             <button onClick={() => { setEditFormData(salaryConfig); setIsEditModalOpen(true); }} className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg><span className="text-[10px] sm:text-xs font-bold uppercase">Edit</span></button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Monthly Breakdown" className="h-auto sm:h-[520px] dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-2 h-full overflow-y-auto custom-scrollbar pr-1 pb-10">
                {[{ label: 'BASIC SALARY', value: basicSalary }, { label: 'HOUSE RENT ALLOWANCE', value: houseRent }, { label: 'MEDICAL ALLOWANCE', value: salaryConfig.medical || 0 }, { label: 'CONVEYANCE ALLOWANCE', value: salaryConfig.conveyance || 0 }, { label: 'FOOD ALLOWANCE', value: salaryConfig.food || 0 }, { label: 'ATTENDANCE BONUS', value: salaryConfig.attendanceBonus || 0 }, { label: `TIFFIN BILL (${salaryConfig.tiffinDays || 0} DAYS)`, value: tiffinBillAmount }].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0"><span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{item.label}</span><span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">৳{(item.value || 0).toLocaleString()}</span></div>
                ))}
                <div className="pt-3 mt-2 mb-2 flex justify-between items-center border-t-2 border-slate-100 dark:border-slate-800">
                  <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Monthly</span>
                  <span className="text-lg sm:text-xl font-black text-blue-700 dark:text-white">৳{totalMonthly.toLocaleString()}</span>
                </div>
              </div>
            </Card>
            <Card title="Bonuses & Festivals" className="h-auto sm:h-[520px] dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-2 h-full overflow-y-auto custom-scrollbar pr-1 pb-10">
                {[{ label: 'YEARLY BONUS', value: yearlyBonus }, { label: 'EID-UL-FITR', value: eidFitr }, { label: 'EID-UL-ADHA', value: eidAdha }].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0"><span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{item.label}</span><span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">৳{(item.value || 0).toLocaleString()}</span></div>
                ))}
                <div className="pt-3 mt-2 mb-2 flex justify-between items-center border-t-2 border-slate-100 dark:border-slate-800">
                  <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Payable (Yearly)</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-white">৳{totalYearlyBonus.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activePayrollSubView === 'Leave' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2"><ICONS.Dashboard className="text-slate-400 w-5 h-5" /><span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter Year:</span></div>
              <div className="flex items-center gap-2">
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-1.5 text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none">{availableYears.map(year => <option key={year} value={year}>{year}</option>)}</select>
                <button onClick={() => setIsAllYearsSummaryOpen(true)} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors" title="View All Years Summary"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></button>
              </div>
            </div>
            <button onClick={() => setIsQuotaModalOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><ICONS.Settings className="w-4 h-4" /><span className="text-xs font-bold uppercase">Edit Quotas</span></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-600 text-white rounded-[24px] p-6 shadow-lg relative overflow-hidden h-40 flex flex-col justify-between">
              <div className="absolute top-4 right-4 opacity-10 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg></div>
              <div className="relative z-10 flex justify-between items-start">
                <div><p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">CASUAL LEAVE ({filterYear})</p><div className="flex flex-col"><span className="text-[10px] font-black opacity-70 uppercase">Days Used</span><span className="text-5xl font-black tracking-tighter">{leaveSummary.casual.used}</span></div></div>
                <div className="text-right"><span className="text-[10px] font-black opacity-70 uppercase block mb-1">Remaining</span><div className="flex items-baseline justify-end gap-1"><span className="text-3xl font-black text-blue-200">{Math.max(0, leaveQuotas.cl - leaveSummary.casual.used)}</span><span className="text-xs font-bold opacity-60">/ {leaveQuotas.cl}</span></div></div>
              </div>
              <div className="relative z-10 space-y-2 mt-auto"><div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden"><div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (leaveSummary.casual.used / leaveQuotas.cl) * 100)}%` }}></div></div></div>
            </div>
            <div className="bg-emerald-600 text-white rounded-[24px] p-6 shadow-lg relative overflow-hidden h-40 flex flex-col justify-between">
              <div className="absolute top-4 right-4 opacity-10 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
              <div className="relative z-10 flex justify-between items-start">
                <div><p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">MEDICAL LEAVE ({filterYear})</p><div className="flex flex-col"><span className="text-[10px] font-black opacity-70 uppercase">Days Used</span><span className="text-5xl font-black tracking-tighter">{leaveSummary.medical.used}</span></div></div>
                <div className="text-right"><span className="text-[10px] font-black opacity-70 uppercase block mb-1">Remaining</span><div className="flex items-baseline justify-end gap-1"><span className="text-3xl font-black text-emerald-100">{Math.max(0, leaveQuotas.ml - leaveSummary.medical.used)}</span><span className="text-xs font-bold opacity-60">/ {leaveQuotas.ml}</span></div></div>
              </div>
              <div className="relative z-10 space-y-2 mt-auto"><div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden"><div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (leaveSummary.medical.used / leaveQuotas.ml) * 100)}%` }}></div></div></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <div className="space-y-4">
              <h4 className="text-blue-600 dark:text-blue-400 font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-1 border-l-4 border-blue-600 pl-3">Casual Leave</h4>
              <div className="space-y-3">
                {clLeaves.length > 0 ? (
                  clLeaves.sort((a,b) => b.startDate.localeCompare(a.startDate)).map(rec => (
                    <div key={rec.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all hover:shadow-md animate-in fade-in slide-in-from-left-2">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 flex-none bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-[10px] rounded-xl flex items-center justify-center">CL</div>
                        <div className="min-w-0"><h5 className="font-bold text-slate-800 dark:text-white text-sm truncate">{rec.reason}</h5><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{formatDate(rec.startDate)} {rec.startDate !== rec.endDate ? ` TO ${formatDate(rec.endDate)}` : ''}</p><p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mt-0.5">{rec.days} {rec.days > 1 ? 'DAYS' : 'DAY'}</p></div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 ml-2">
                        <button onClick={() => handleEditLeave(rec)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <DeleteButton onClick={() => handleDeleteLeaveRequest(rec)} />
                      </div>
                    </div>
                  ))
                ) : <div className="py-6 text-center text-slate-300 dark:text-slate-600 italic text-xs">No spent Casual Leaves</div>}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-1 border-l-4 border-emerald-600 pl-3">Medical Leave</h4>
              <div className="space-y-3">
                {mlLeaves.length > 0 ? (
                  mlLeaves.sort((a,b) => b.startDate.localeCompare(a.startDate)).map(rec => (
                    <div key={rec.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all hover:shadow-md animate-in fade-in slide-in-from-right-2">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 flex-none bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-[10px] rounded-xl flex items-center justify-center">ML</div>
                        <div className="min-w-0"><h5 className="font-bold text-slate-800 dark:text-white text-sm truncate">{rec.reason}</h5><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{formatDate(rec.startDate)} {rec.startDate !== rec.endDate ? ` TO ${formatDate(rec.endDate)}` : ''}</p><p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mt-0.5">{rec.days} {rec.days > 1 ? 'DAYS' : 'DAY'}</p></div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 ml-2">
                        <button onClick={() => handleEditLeave(rec)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <DeleteButton onClick={() => handleDeleteLeaveRequest(rec)} />
                      </div>
                    </div>
                  ))
                ) : <div className="py-6 text-center text-slate-300 dark:text-slate-600 italic text-xs">No spent Medical Leaves</div>}
              </div>
            </div>
          </div>
          <button onClick={() => { setEditingLeave(null); setLeaveFormData({ type: 'CL', reason: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], days: 1 }); setIsLeaveModalOpen(true); }} className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-light hover:scale-110 active:scale-95 transition-all z-[60] group"><span className="group-hover:rotate-90 transition-transform duration-300">+</span></button>
        </div>
      )}

      {activePayrollSubView === 'Attendance' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 pb-24 lg:pb-0">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2 mr-2"><ICONS.Dashboard className="text-slate-400 w-5 h-5" /><span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filter Period:</span></div>
              <div className="flex items-center gap-2">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-1.5 text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none min-w-[140px]"><option value="all">All Months</option>{['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (<option key={m} value={m}>{new Date(2000, parseInt(m)-1).toLocaleString('default', { month: 'long' })}</option>))}</select>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-1.5 text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none">{attendanceYears.map(year => <option key={year} value={year}>{year}</option>)}</select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 transition-all hover:shadow-md"><p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Present</p><h4 className="text-2xl font-black text-emerald-800 dark:text-white">{attendanceStats.present}</h4></div>
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 transition-all hover:shadow-md"><p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Absent</p><h4 className="text-2xl font-black text-rose-800 dark:text-white">{attendanceStats.absent}</h4></div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 transition-all hover:shadow-md"><p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Holiday</p><h4 className="text-2xl font-black text-amber-800 dark:text-white">{attendanceStats.holiday}</h4></div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 transition-all hover:shadow-md"><p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Offday</p><h4 className="text-2xl font-black text-slate-800 dark:text-white">{attendanceStats.offDay}</h4></div>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-2xl p-4 transition-all hover:shadow-md"><p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Late</p><h4 className="text-2xl font-black text-orange-800 dark:text-white">{attendanceStats.late}</h4></div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 transition-all hover:shadow-md"><p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Tiffin</p><h4 className="text-2xl font-black text-indigo-800 dark:text-white">{attendanceStats.tiffin}</h4></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 flex justify-between items-center"><h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Attendance Log</h3><div className="flex gap-4"><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Late (8:01 AM+)</span></div><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tiffin (7:00 PM+)</span></div></div></div>
            <div className="overflow-x-visible">
              <table className="w-full text-left border-collapse table-fixed">
                <thead><tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"><th className="w-[26%] px-1 sm:px-6 py-4 text-[7px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th><th className="w-[42%] px-1 sm:px-6 py-4 text-[7px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">In-Out Time</th><th className="w-[18%] px-1 sm:px-6 py-4 text-[7px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th><th className="w-[14%] px-1 sm:px-6 py-4 text-[7px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase text-right">Act</th></tr></thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {attendanceRecords.filter(r => { const yearMatch = r.date.startsWith(filterYear); if (selectedMonth === 'all') return yearMatch; return yearMatch && r.date.split('-')[1] === selectedMonth; }).sort((a, b) => b.date.localeCompare(a.date)).map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-1 sm:px-6 py-4"><div className="flex flex-col"><span className="text-[10px] sm:text-sm font-black text-slate-800 dark:text-white tracking-tight">{formatDate(rec.date)}</span><span className="text-[7px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase">{new Date(rec.date).toLocaleDateString('default', { weekday: 'long' })}</span></div></td>
                        <td className="px-1 sm:px-6 py-4"><div className="flex items-start gap-1 sm:gap-3"><div className="flex flex-col items-start gap-0.5"><span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-xs font-black whitespace-nowrap">{rec.inTime ? formatTo12Hr(rec.inTime) : '--:--'}</span>{rec.isLate && (<div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-orange-500"></div><span className="text-[6px] sm:text-[8px] font-black text-orange-600 uppercase">LATE</span></div>)}</div><span className="text-slate-300 dark:text-slate-700 font-bold mt-1">→</span><div className="flex flex-col items-start gap-0.5">{rec.outTime ? (<span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-xs font-black whitespace-nowrap">{formatTo12Hr(rec.outTime)}</span>) : (rec.type === 'Standard' && rec.inTime ? (<div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-1 sm:px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/50 animate-pulse"><span className="text-[6px] sm:text-[8px] font-black uppercase whitespace-nowrap">Out Missing</span></div>) : (<span className="text-slate-300 dark:text-slate-700 text-[8px] sm:text-xs font-black">--:--</span>))}{rec.hasTiffin && (<div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-blue-600"></div><span className="text-[6px] sm:text-[8px] font-black text-blue-600 uppercase">TIFFIN</span></div>)}</div></div></td>
                        <td className="px-1 sm:px-6 py-4"><div className={`inline-flex items-center px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[7px] sm:text-[10px] font-black uppercase shadow-sm border ${rec.status === 'PRESENT' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : rec.status === 'ABSENT' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50' : rec.status === 'Holiday' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>{rec.status}</div></td>
                        <td className="px-1 sm:px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5 sm:gap-2 items-center">
                            <button onClick={() => handleEditAttendance(rec)} className="p-1 sm:p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-all" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                            <DeleteButton onClick={() => handleDeleteAttendanceRequest(rec)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <button onClick={() => { setEditingAttendanceId(null); setAttendanceFormData({ date: new Date().toISOString().split('T')[0], dates: [], type: 'Standard', inTime: '', outTime: '' }); setIsAttendanceModalOpen(true); }} className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-light hover:scale-110 active:scale-95 transition-all z-[60] group"><span className="group-hover:rotate-90 transition-transform duration-300">+</span></button>
        </div>
      )}

      {/* Unified Danger Zone Modal */}
      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => { 
          setIsDeleteConfirmOpen(false); 
          setEntryToDelete(null); 
          setLeaveToDelete(null); 
          setAttendanceToDelete(null); 
        }} 
        title="Danger Zone"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </div>
          <p className="text-slate-800 dark:text-white font-bold text-base sm:text-lg">Are you absolutely sure?</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm px-4">This action cannot be undone. The selected record will be permanently removed.</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              onClick={() => { 
                setIsDeleteConfirmOpen(false); 
                setEntryToDelete(null); 
                setLeaveToDelete(null); 
                setAttendanceToDelete(null); 
              }} 
              className="py-2.5 sm:py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleUnifiedConfirmDelete} 
              className="py-2.5 sm:py-3 px-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 transition-all active:scale-95 text-sm"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title={editingAttendanceId ? "Update Attendance" : "Log Attendance"}>
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">{(['Standard', 'Holiday', 'Off Day'] as const).map((type) => (<button key={type} className={`py-2 text-[10px] font-black rounded-xl transition-all uppercase ${attendanceFormData.type === type ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => setAttendanceFormData({...attendanceFormData, type: type})}>{type}</button>))}</div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Date</label><div className="flex gap-2"><input type="date" value={attendanceFormData.date} onChange={(e) => setAttendanceFormData({...attendanceFormData, date: e.target.value})} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-sm dark:text-white" />{(attendanceFormData.type === 'Holiday' || attendanceFormData.type === 'Off Day') && !editingAttendanceId && (<button onClick={addDateToMultiList} className="px-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all text-sm">ADD</button>)}</div></div>
          {(attendanceFormData.type === 'Holiday' || attendanceFormData.type === 'Off Day') && attendanceFormData.dates && attendanceFormData.dates.length > 0 && (<div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Dates ({attendanceFormData.dates.length})</label><div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">{attendanceFormData.dates.map(d => (<div key={d} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2 animate-in zoom-in-90">{formatDate(d)}<button onClick={() => removeDateFromMultiList(d)} className="text-blue-400 hover:text-blue-600">×</button></div>))}</div></div>)}
          {attendanceFormData.type === 'Standard' && (<div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Check-In Time</label><input type="time" value={attendanceFormData.inTime} onChange={(e) => setAttendanceFormData({...attendanceFormData, inTime: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-sm dark:text-white" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Check-Out Time</label><input type="time" value={attendanceFormData.outTime} onChange={(e) => setAttendanceFormData({...attendanceFormData, outTime: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-sm dark:text-white" /></div></div>)}
          <button onClick={handleSaveAttendance} className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-2xl shadow-2xl hover:bg-black dark:hover:bg-blue-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">{editingAttendanceId ? "UPDATE ENTRY" : "CONFIRM ENTRIES"}</button>
        </div>
      </Modal>

      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title={editingLeave ? "Edit Leave Record" : "Log New Leave"}>
        <div className="space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"><button className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${leaveFormData.type === 'CL' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => setLeaveFormData({...leaveFormData, type: 'CL'})}>Casual (CL)</button><button className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${leaveFormData.type === 'ML' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => setLeaveFormData({...leaveFormData, type: 'ML'})}>Medical (ML)</button></div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason</label><input type="text" value={leaveFormData.reason} onChange={(e) => setLeaveFormData({...leaveFormData, reason: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" placeholder="Reason..." /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</label><input type="date" value={leaveFormData.startDate} onChange={(e) => setLeaveFormData({...leaveFormData, startDate: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</label><input type="date" value={leaveFormData.endDate} onChange={(e) => setLeaveFormData({...leaveFormData, endDate: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" /></div></div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Days</label><input type="number" value={leaveFormData.days} readOnly className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm" /></div>
          <button onClick={handleSaveLeave} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all text-sm">{editingLeave ? "Update Record" : "Save Record"}</button>
        </div>
      </Modal>

      <Modal isOpen={isQuotaModalOpen} onClose={() => setIsQuotaModalOpen(false)} title="Configure Leave Quotas">
        <div className="space-y-4">
          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Casual Leave Quota (Annual)</label><input type="number" value={leaveQuotas.cl} onChange={(e) => setLeaveQuotas({...leaveQuotas, cl: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" /></div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Medical Leave Quota (Annual)</label><input type="number" value={leaveQuotas.ml} onChange={(e) => setLeaveQuotas({...leaveQuotas, ml: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" /></div>
          <button onClick={() => setIsQuotaModalOpen(false)} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">Save Quotas</button>
        </div>
      </Modal>

      <Modal isOpen={isAllYearsSummaryOpen} onClose={() => setIsAllYearsSummaryOpen(false)} title="Annual Leave Summary">
        <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse"><thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th><th className="px-4 py-3 text-[10px] font-black text-blue-600 uppercase tracking-widest">CL Used</th><th className="px-4 py-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest">ML Used</th></tr></thead><tbody className="divide-y divide-slate-50 dark:divide-slate-800">{allYearsSummary.map((row) => (<tr key={row.year} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${row.year === filterYear ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}><td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{row.year}</td><td className="px-4 py-3 font-black text-blue-600 dark:text-blue-400">{row.cl} Days</td><td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">{row.ml} Days</td></tr>))}</tbody></table>
        </div>
      </Modal>

      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={editingHistoryId ? "Edit Salary Entry" : "Add Increment"}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
          {prevTotalForCalc > 0 && <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 mb-2"><p className="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase mb-1 tracking-wider">Calculation Base</p><div className="flex justify-between text-[11px] sm:text-xs font-bold text-blue-800 dark:text-blue-200"><span>Previous Total:</span><span>৳{prevTotalForCalc.toLocaleString()}</span></div></div>}
          <div className="grid grid-cols-2 gap-3 sm:gap-4"><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Year</label><input type="text" value={historyFormData.year} onChange={e => handleHistoryFieldChange('year', e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-white" placeholder="2025" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Base Deduction (৳)</label><input type="number" value={historyFormData.baseDeduction} onChange={e => handleHistoryFieldChange('baseDeduction', e.target.value)} className="w-full p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold text-slate-700 dark:text-slate-300 text-sm" /></div></div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4"><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">% Increase</label><input type="number" step="0.01" value={historyFormData.increasePercent} onChange={e => handleHistoryFieldChange('increasePercent', e.target.value)} className="w-full p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm dark:text-white" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Amount + (৳)</label><input type="number" value={historyFormData.amountAdd} readOnly className="w-full p-2.5 sm:p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed font-bold text-sm" /></div></div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">G.Total (৳)</label><input type="number" value={historyFormData.total} readOnly className="w-full p-2.5 sm:p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed font-black text-sm" /></div>
          <button onClick={handleSaveHistoryEntry} className="w-full py-3 sm:py-4 bg-slate-800 dark:bg-blue-600 text-white text-sm sm:text-base font-bold rounded-xl shadow-lg hover:bg-slate-900 dark:hover:bg-blue-700 transition-all active:scale-95">{editingHistoryId ? "Update Record" : "Add Record"}</button>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Configuration">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Salary (৳)</label><input type="number" value={editFormData.grossSalary} onChange={(e) => setEditFormData({...editFormData, grossSalary: Number(e.target.value)})} className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm dark:text-white" /></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Medical (৳)</label><input type="number" value={editFormData.medical} onChange={(e) => setEditFormData({...editFormData, medical: Number(e.target.value)})} className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm dark:text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conveyance (৳)</label><input type="number" value={editFormData.conveyance} onChange={(e) => setEditFormData({...editFormData, conveyance: Number(e.target.value)})} className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm dark:text-white" /></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Food (৳)</label><input type="number" value={editFormData.food} onChange={(e) => setEditFormData({...editFormData, food: Number(e.target.value)})} className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm dark:text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Atten. Bonus (৳)</label><input type="number" value={editFormData.attendanceBonus} onChange={(e) => setEditFormData({...editFormData, attendanceBonus: Number(e.target.value)})} className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm dark:text-white" /></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiffin (Days)</label><input type="number" value={editFormData.tiffinDays} onChange={(e) => setEditFormData({...editFormData, tiffinDays: Number(e.target.value)})} className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm dark:text-white" /></div>
          </div>
          <button onClick={handleEditSave} className="w-full py-3 sm:py-4 bg-blue-600 text-white text-sm sm:text-base font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 mt-4">Update Configuration</button>
        </div>
      </Modal>
    </div>
  );
};
