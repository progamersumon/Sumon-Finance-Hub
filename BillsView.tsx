
import React, { useState, useMemo } from 'react';
import { Bill } from './types';
import { Card, Modal, DeleteButton } from './components';
import { formatDate } from './utils';

const ElectricIcon = ({ className = "text-amber-500" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);

const WifiIcon = ({ className = "text-blue-500" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
);

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const shortMonthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const BillsView: React.FC<{
  bills: Bill[];
  onAddBill: (b: Bill) => void;
  onUpdateBill: (b: Bill) => void;
  onDeleteBill: (id: string) => void;
}> = ({ bills, onAddBill, onUpdateBill, onDeleteBill }) => {
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: 'Electric Bill',
    category: 'Electric' as 'Electric' | 'Wifi',
    amount: 0,
    selectedMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    selectedYear: new Date().getFullYear().toString(),
    status: 'pending' as 'paid' | 'pending' | 'overdue'
  });

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(bills.map(b => b.dueDate.split('-')[0])));
    const currentYear = new Date().getFullYear().toString();
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b.localeCompare(a));
  }, [bills]);

  const electricBills = useMemo(() => {
    return bills.filter(b => 
      b.category === 'Electric' && 
      b.dueDate.startsWith(filterYear)
    ).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [bills, filterYear]);

  const wifiBills = useMemo(() => {
    return bills.filter(b => 
      b.category === 'Wifi' && 
      b.dueDate.startsWith(filterYear)
    ).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [bills, filterYear]);

  const yearlyStats = useMemo(() => {
    const yearPaidBills = bills.filter(b => b.dueDate.startsWith(filterYear) && b.status === 'paid');
    
    // Electric Stats
    const electricPaidList = yearPaidBills.filter(b => b.category === 'Electric');
    const electricTotal = electricPaidList.reduce((sum, b) => sum + b.amount, 0);
    const electricCount = electricPaidList.length;
    
    // Wifi Stats
    const wifiPaidList = yearPaidBills.filter(b => b.category === 'Wifi');
    const wifiTotal = wifiPaidList.reduce((sum, b) => sum + b.amount, 0);
    const wifiCount = wifiPaidList.length;
    
    return {
      electric: { 
        total: electricTotal, 
        avg: electricCount > 0 ? electricTotal / electricCount : 0 
      },
      wifi: { 
        total: wifiTotal, 
        avg: wifiCount > 0 ? wifiTotal / wifiCount : 0 
      }
    };
  }, [bills, filterYear]);

  const handleSave = () => {
    const finalName = formData.name || (formData.category === 'Electric' ? 'Electric Bill' : 'Wifi Bill');
    if (!formData.amount) return alert("Please enter the amount.");

    const constructedDate = `${formData.selectedYear}-${formData.selectedMonth}-01`;

    const billData: Bill = {
      id: editingBill?.id || Math.random().toString(36).substr(2, 9),
      name: finalName,
      category: formData.category,
      amount: Number(formData.amount),
      dueDate: constructedDate,
      status: formData.status
    };

    if (editingBill) {
      onUpdateBill(billData);
    } else {
      onAddBill(billData);
    }

    setIsModalOpen(false);
    setEditingBill(null);
  };

  const startEdit = (bill: Bill) => {
    const [year, month] = bill.dueDate.split('-');
    setEditingBill(bill);
    setFormData({
      ...bill,
      selectedMonth: month,
      selectedYear: year
    });
    setIsModalOpen(true);
  };

  const startDelete = (id: string) => {
    setBillToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (billToDelete) {
      onDeleteBill(billToDelete);
      setBillToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const openAddModal = () => {
    setEditingBill(null);
    setFormData({ 
      name: 'Electric Bill', 
      category: 'Electric',
      amount: 0, 
      selectedMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
      selectedYear: new Date().getFullYear().toString(),
      status: 'pending' 
    }); 
    setIsModalOpen(true);
  };

  const renderBillTable = (billList: Bill[], title: string) => (
    <Card title={title} className="dark:bg-slate-900 dark:border-slate-800">
      <div className="overflow-x-hidden">
        {billList.length > 0 ? (
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[16%]">Period</th>
                <th className="px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[38%]">Bill Name</th>
                <th className="px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[26%]">Amount</th>
                <th className="px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[20%] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {billList.map(bill => {
                const [year, month] = bill.dueDate.split('-');
                const monthName = shortMonthNames[parseInt(month) - 1];
                return (
                  <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-2 sm:px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 dark:text-white text-[10px] sm:text-sm uppercase tracking-tighter">{monthName}</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500">{year}</span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                           <span className="flex-none">{bill.category === 'Electric' ? <ElectricIcon /> : <WifiIcon />}</span>
                           <span className="font-bold text-slate-800 dark:text-slate-300 text-[11px] sm:text-sm truncate">{bill.name}</span>
                        </div>
                        <span className={`text-[7px] sm:text-[8px] font-black uppercase inline-block w-fit px-1 sm:px-1.5 rounded mt-1 ml-5 sm:ml-6 ${
                          bill.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                          bill.status === 'overdue' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <span className="font-black text-slate-900 dark:text-slate-200 text-[11px] sm:text-sm">৳{bill.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-2 sm:px-4 py-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button onClick={() => startEdit(bill)} className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <DeleteButton onClick={() => startDelete(bill.id)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center">
            <p className="text-slate-400 dark:text-slate-600 italic text-sm">No bills found for this category and year.</p>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      {/* Year Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filter Year:</span>
        </div>
        <select 
          value={filterYear} 
          onChange={(e) => setFilterYear(e.target.value)} 
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-1.5 text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-8 border-l-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <ElectricIcon className="text-amber-500 w-4 h-4" />
            <h4 className="text-[10px] sm:text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Electric Bills</h4>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Total Paid</p>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">৳{yearlyStats.electric.total.toLocaleString()}</h3>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Monthly Average</p>
              <h4 className="text-sm sm:text-lg font-bold text-amber-600 dark:text-amber-400">৳{Math.round(yearlyStats.electric.avg).toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-8 border-l-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <WifiIcon className="text-blue-500 w-4 h-4" />
            <h4 className="text-[10px] sm:text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Wifi Bills</h4>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Total Paid</p>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">৳{yearlyStats.wifi.total.toLocaleString()}</h3>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Monthly Average</p>
              <h4 className="text-sm sm:text-lg font-bold text-blue-600 dark:text-blue-400">৳{Math.round(yearlyStats.wifi.avg).toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Histories Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderBillTable(electricBills, "Electric Bills History")}
        {renderBillTable(wifiBills, "Wifi Bills History")}
      </div>

      {/* Floating Add Button */}
      <button 
        className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-light hover:scale-110 active:scale-95 transition-all z-[60]"
        onClick={openAddModal}
      >
        +
      </button>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBill ? "Edit Bill" : "Add New Bill"}>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Select Bill Type</label>
            <div className="flex flex-row gap-2">
              <button 
                onClick={() => setFormData({...formData, name: 'Electric Bill', category: 'Electric'})}
                className={`flex-1 flex items-center justify-between px-3 py-3.5 rounded-2xl border text-[11px] sm:text-sm font-bold transition-all ${formData.category === 'Electric' ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <div className="flex items-center gap-2">
                  <ElectricIcon /> 
                  <span>Electric Bill</span>
                </div>
              </button>
              
              <button 
                onClick={() => setFormData({...formData, name: 'Wifi Bill', category: 'Wifi'})}
                className={`flex-1 flex items-center justify-between px-3 py-3.5 rounded-2xl border text-[11px] sm:text-sm font-bold transition-all ${formData.category === 'Wifi' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <div className="flex items-center gap-2">
                  <WifiIcon /> 
                  <span>Wifi Bill</span>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Month</label>
              <select 
                value={formData.selectedMonth} 
                onChange={(e) => setFormData({...formData, selectedMonth: e.target.value})} 
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm font-bold dark:text-white"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={(idx + 1).toString().padStart(2, '0')}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Year</label>
              <input 
                type="number" 
                value={formData.selectedYear} 
                onChange={(e) => setFormData({...formData, selectedYear: e.target.value})} 
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm font-bold dark:text-white" 
                placeholder="2025"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Amount (৳)</label>
              <input type="number" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-sm dark:text-white" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {['pending', 'paid'].map((s) => (
                  <button 
                    key={s}
                    onClick={() => setFormData({...formData, status: s as any})}
                    className={`py-3.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      formData.status === s 
                        ? s === 'pending' 
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md' 
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button onClick={handleSave} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs active:scale-95 mt-2">
            {editingBill ? "Update Bill" : "Save Bill"}
          </button>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Remove Bill">
        <div className="text-center space-y-4 p-2">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </div>
          <p className="font-bold text-slate-800 dark:text-white">Delete this record?</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs px-4">This bill history will be permanently removed. This action cannot be undone.</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => setIsDeleteConfirmOpen(false)} className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button onClick={confirmDelete} className="py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-100 dark:shadow-rose-900/20">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
