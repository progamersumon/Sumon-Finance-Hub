import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Zap, 
  Wifi, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  Pencil,
  AlertTriangle 
} from 'lucide-react';
import { Bill, Transaction } from './types';
import { Modal, DeleteButton } from './components';

interface BillInfoViewProps {
  bills: Bill[];
  onAddBill: (b: Bill) => void;
  onUpdateBill: (b: Bill) => void;
  onDeleteBill: (id: string) => void;
}

export const BillsView: React.FC<BillInfoViewProps> = ({ 
  bills, 
  onAddBill, 
  onUpdateBill, 
  onDeleteBill 
}) => {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const [formData, setFormData] = useState({
    category: 'Electric' as 'Electric' | 'Wifi',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    name: 'Electric Bill'
  });

  const availableYears = useMemo(() => {
    const years = (Array.from(new Set(bills.map(b => b.dueDate.split('-')[0]))) as string[]);
    const current = new Date().getFullYear().toString();
    return Array.from(new Set([...years, current])).sort((a, b) => b.localeCompare(a));
  }, [bills]);

  const stats = useMemo(() => {
    const yearBills = bills.filter(b => b.dueDate.startsWith(selectedYear));
    const electric = yearBills.filter(b => b.category === 'Electric');
    const wifi = yearBills.filter(b => b.category === 'Wifi');
    const totalE = electric.reduce((sum, b) => sum + b.amount, 0);
    const totalW = wifi.reduce((sum, b) => sum + b.amount, 0);
    const eMonths = new Set(electric.map(b => b.dueDate.substring(0, 7))).size;
    const wMonths = new Set(wifi.map(b => b.dueDate.substring(0, 7))).size;
    return {
      electric: { total: totalE, avg: eMonths > 0 ? totalE / eMonths : 0, list: electric, months: eMonths },
      wifi: { total: totalW, avg: wMonths > 0 ? totalW / wMonths : 0, list: wifi, months: wMonths }
    };
  }, [bills, selectedYear]);

  const handleSaveBill = () => {
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) return;
    const billData: Bill = {
      id: editingBill?.id || Math.random().toString(36).substr(2, 9),
      category: formData.category,
      amount: amt,
      dueDate: formData.date,
      name: `${formData.category} Bill`,
      status: 'paid'
    };
    if (editingBill) onUpdateBill(billData);
    else onAddBill(billData);
    setIsModalOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-slate-400" />
          <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Filter Year:</span>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-1 text-[13px] font-black text-indigo-600 outline-none">
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/50 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-amber-600" />
            <h3 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">ELECTRIC BILLS</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TOTAL PAID</p><h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">৳{stats.electric.total.toLocaleString()}</h2></div>
            <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">AVG ({stats.electric.months} MO)</p><h4 className="text-xl font-black text-amber-600 tracking-tighter">৳{Math.round(stats.electric.avg).toLocaleString()}</h4></div>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-300 dark:border-blue-700/50 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={16} className="text-blue-600" />
            <h3 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">WIFI BILLS</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TOTAL PAID</p><h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">৳{stats.wifi.total.toLocaleString()}</h2></div>
            <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">AVG ({stats.wifi.months} MO)</p><h4 className="text-xl font-black text-blue-600 tracking-tighter">৳{Math.round(stats.wifi.avg).toLocaleString()}</h4></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { type: 'Electric', data: stats.electric, color: 'amber' },
          { type: 'Wifi', data: stats.wifi, color: 'blue' }
        ].map(section => (
          <div key={section.type} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[350px]">
            <div className={`px-5 py-4 border-b border-slate-50 dark:border-slate-800 bg-${section.color}-100/40 dark:bg-${section.color}-900/20`}>
              <h3 className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                {section.type === 'Electric' ? <Zap size={14} className="text-amber-500" /> : <Wifi size={14} className="text-blue-600" />} {section.type} Bills History
              </h3>
            </div>
            <div className="p-4 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar">
              {section.data.list.length > 0 ? section.data.list.sort((a,b) => b.dueDate.localeCompare(a.dueDate)).map(bill => (
                <div key={bill.id} className={`p-3 bg-${section.color}-100/60 dark:bg-${section.color}-900/30 border border-${section.color}-200/50 dark:border-slate-800/50 rounded-xl flex items-center justify-between group hover:bg-${section.color}-200/80 transition-all shadow-sm`}>
                  <div className="flex flex-col"><span className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">{formatDate(bill.dueDate)}</span><span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{bill.name}</span></div>
                  <div className="flex items-center gap-3"><span className={`text-[13px] font-black text-${section.color}-700 dark:text-${section.color}-400`}>৳{bill.amount.toLocaleString()}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setFormData({ category: bill.category, amount: bill.amount.toString(), date: bill.dueDate, name: bill.name }); setEditingBill(bill); setIsModalOpen(true); }} className="p-1.5 text-indigo-600 bg-white/80 dark:bg-slate-800 rounded-lg shadow-sm"><Pencil size={12} /></button>
                      <button onClick={() => { setRecordToDelete(bill); setIsDeleteModalOpen(true); }} className="p-1.5 text-rose-600 bg-white/80 dark:bg-slate-800 rounded-lg shadow-sm"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              )) : <div className="flex h-full items-center justify-center p-12 text-center opacity-30 italic">No records</div>}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => { setFormData({ category: 'Electric', amount: '', date: new Date().toISOString().split('T')[0], name: 'Electric Bill' }); setEditingBill(null); setIsModalOpen(true); }} className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-all hover:scale-110 group"><Plus size={32} className="group-hover:rotate-90 transition-transform" /></button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBill ? 'Edit Bill Payment' : 'Record Bill Payment'}>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bill Category</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
              <button onClick={() => setFormData({...formData, category: 'Electric'})} className={`py-2 text-[11px] font-black uppercase rounded-lg transition-all ${formData.category === 'Electric' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500'}`}>Electric</button>
              <button onClick={() => setFormData({...formData, category: 'Wifi'})} className={`py-2 text-[11px] font-black uppercase rounded-lg transition-all ${formData.category === 'Wifi' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Wifi</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (৳)</label><input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl text-[14px] font-black outline-none focus:border-indigo-500" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl text-[12px] font-bold outline-none focus:border-indigo-500" /></div>
          </div>
          <button onClick={handleSaveBill} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[14px] uppercase shadow-xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"><Save size={18} /> {editingBill ? 'Update Record' : 'Save Record'}</button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove Record?">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner"><AlertTriangle size={32} /></div>
          <p className="text-[16px] font-black text-slate-900 dark:text-white uppercase">Remove Record?</p>
          <div className="flex gap-4">
            <button onClick={() => { if (recordToDelete) onDeleteBill(recordToDelete.id); setIsDeleteModalOpen(false); }} className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl text-[12px] font-black uppercase">Delete</button>
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl text-[12px] font-black uppercase">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
