
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Bet } from './types';
import { Card, Modal, DeleteButton } from './components';

const shortMonthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const fullMonthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const BettingView: React.FC<{
  bets: Bet[];
  onAddBet: (b: Bet) => void;
  onUpdateBet: (b: Bet) => void;
  onDeleteBet: (id: string) => void;
}> = ({ bets, onAddBet, onUpdateBet, onDeleteBet }) => {
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isYearSummaryOpen, setIsYearSummaryOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [betToDelete, setBetToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: 0,
    status: 'deposit' as 'deposit' | 'withdraw',
    date: new Date().toISOString().split('T')[0]
  });

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(bets.map(b => b.date.split('-')[0])));
    const currentYear = new Date().getFullYear().toString();
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b.localeCompare(a));
  }, [bets]);

  const depositList = useMemo(() => {
    return bets.filter(b => 
      (b.status as any) === 'deposit' && 
      b.date.startsWith(filterYear)
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [bets, filterYear]);

  const withdrawList = useMemo(() => {
    return bets.filter(b => 
      (b.status as any) === 'withdraw' && 
      b.date.startsWith(filterYear)
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [bets, filterYear]);

  const yearlyStats = useMemo(() => {
    const yearBets = bets.filter(b => b.date.startsWith(filterYear));
    const totalDeposit = yearBets.filter(b => (b.status as any) === 'deposit').reduce((sum, b) => sum + b.amount, 0);
    const totalWon = yearBets.filter(b => (b.status as any) === 'withdraw').reduce((sum, b) => sum + b.amount, 0);
    const netResult = totalWon - totalDeposit;
    
    return { totalWon, totalDeposit, netResult };
  }, [bets, filterYear]);

  const monthlySummary = useMemo(() => {
    return fullMonthNames.map((month, idx) => {
      const monthNum = (idx + 1).toString().padStart(2, '0');
      const monthPrefix = `${filterYear}-${monthNum}`;
      const monthBets = bets.filter(b => b.date.startsWith(monthPrefix));
      
      const deposit = monthBets
        .filter(b => (b.status as any) === 'deposit')
        .reduce((sum, b) => sum + b.amount, 0);
        
      const withdraw = monthBets
        .filter(b => (b.status as any) === 'withdraw')
        .reduce((sum, b) => sum + b.amount, 0);
        
      return {
        month,
        deposit,
        withdraw,
        profit: withdraw - deposit
      };
    }).filter(m => m.deposit > 0 || m.withdraw > 0);
  }, [bets, filterYear]);

  const pieData = useMemo(() => [
    { name: 'Deposit History', value: yearlyStats.totalDeposit, color: '#2563eb' },
    { name: 'Withdraw History', value: yearlyStats.totalWon, color: '#10b981' }
  ], [yearlyStats]);

  const handleSave = () => {
    if (!formData.amount) return alert("Please enter the amount.");

    const betData: Bet = {
      id: editingBet?.id || Math.random().toString(36).substr(2, 9),
      event: formData.status === 'deposit' ? 'Deposit' : 'Withdrawal',
      amount: Number(formData.amount),
      status: formData.status as any,
      date: formData.date,
    };

    if (editingBet) onUpdateBet(betData);
    else onAddBet(betData);

    setIsModalOpen(false);
    setEditingBet(null);
  };

  const startEdit = (bet: Bet) => {
    setEditingBet(bet);
    setFormData({
      amount: bet.amount,
      status: bet.status as any,
      date: bet.date
    });
    setIsModalOpen(true);
  };

  const startDelete = (id: string) => {
    setBetToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (betToDelete) {
      onDeleteBet(betToDelete);
      setBetToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const openAddModal = () => {
    setEditingBet(null);
    setFormData({ 
      amount: 0, 
      status: 'deposit',
      date: new Date().toISOString().split('T')[0]
    }); 
    setIsModalOpen(true);
  };

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name, percent } = props;
    const RADIAN = Math.PI / 180;
    const radiusOutside = outerRadius + 22;
    const xOutside = cx + radiusOutside * Math.cos(-midAngle * RADIAN);
    const yOutside = cy + radiusOutside * Math.sin(-midAngle * RADIAN);
    const radiusInside = innerRadius + (outerRadius - innerRadius) * 0.5;
    const xInside = cx + radiusInside * Math.cos(-midAngle * RADIAN);
    const yInside = cy + radiusInside * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <line 
          x1={cx + outerRadius * Math.cos(-midAngle * RADIAN)} 
          y1={cy + outerRadius * Math.sin(-midAngle * RADIAN)} 
          x2={cx + (outerRadius + 8) * Math.cos(-midAngle * RADIAN)} 
          y2={cy + (outerRadius + 8) * Math.sin(-midAngle * RADIAN)} 
          stroke="#475569" 
          strokeWidth={1} 
        />
        <text 
          x={xOutside} 
          y={yOutside} 
          fill="#94a3b8" 
          textAnchor={xOutside > cx ? 'start' : 'end'} 
          dominantBaseline="central" 
          className="text-[10px] font-bold"
        >
          {name}
        </text>
        <text 
          x={xInside} 
          y={yInside} 
          fill="white" 
          textAnchor="middle" 
          dominantBaseline="central" 
          className="font-black text-[10px]"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };

  const renderBetTable = (betList: Bet[], title: string) => (
    <Card title={title} className="dark:bg-slate-900 dark:border-slate-800">
      <div className="overflow-x-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-2 sm:px-4 py-3 text-[9px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[35%]">Date</th>
              <th className="px-2 sm:px-4 py-3 text-[9px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[40%] text-center">Amount</th>
              <th className="px-2 sm:px-4 py-3 text-[9px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[25%] text-right">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {betList.length > 0 ? (
              betList.map(bet => {
                const dateParts = bet.date.split('-');
                const monthName = shortMonthNames[parseInt(dateParts[1]) - 1];
                const day = dateParts[2];
                return (
                  <tr key={bet.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-2 sm:px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-white text-[11px] sm:text-sm">{day} {monthName}</span>
                        <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{dateParts[0]}</span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-4 text-center">
                      <span className={`font-black text-[12px] sm:text-[16px] ${(bet.status as any) === 'withdraw' ? 'text-emerald-500 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        ৳{bet.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button onClick={() => startEdit(bet)} className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-blue-500 bg-blue-50/50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-100 dark:border-blue-900/50">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <DeleteButton onClick={() => startDelete(bet.id)} />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="py-20 text-center text-slate-300 dark:text-slate-600 italic text-sm">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      {/* Year Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-300">Filter Year:</span>
          </div>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-1.5 text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none">
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <button 
          onClick={() => setIsYearSummaryOpen(true)}
          className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          title="Yearly Summary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-[6px] border-l-blue-600 transition-transform hover:-translate-y-1">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">Deposit History</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">৳{yearlyStats.totalDeposit.toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-[6px] border-l-emerald-500 transition-transform hover:-translate-y-1">
          <p className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 mb-1">Withdraw History</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">৳{yearlyStats.totalWon.toLocaleString()}</h3>
        </div>
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-[6px] transition-transform hover:-translate-y-1 ${yearlyStats.netResult < 0 ? 'border-l-rose-500' : 'border-l-indigo-500'}`}>
          <p className={`text-[11px] font-bold mb-1 ${yearlyStats.netResult < 0 ? 'text-rose-500' : 'text-indigo-500'}`}>
            {yearlyStats.netResult < 0 ? 'Total Loss' : 'Net Profit'}
          </p>
          <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${yearlyStats.netResult < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
            {yearlyStats.netResult < 0 ? '-' : ''}৳{Math.abs(yearlyStats.netResult).toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Main Grid: Distribution | Deposit | Won */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Betting Distribution */}
        <div className="order-1">
          <Card title="Betting Distribution" className="dark:bg-slate-900 dark:border-slate-800">
            <div className="h-[260px] sm:h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={55} 
                    outerRadius={80} 
                    paddingAngle={3} 
                    dataKey="value" 
                    label={renderCustomizedLabel} 
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold', color: '#fff' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6 px-2">
              {pieData.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-[12px] font-black" style={{ color: item.color }}>৳{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Column 2: Deposit History Table */}
        <div className="order-2">
          {renderBetTable(depositList, "Deposit History")}
        </div>
        
        {/* Column 3: Withdraw History Table */}
        <div className="order-3">
          {renderBetTable(withdrawList, "Withdraw History")}
        </div>
      </div>

      {/* Monthly Summary Modal */}
      <Modal 
        isOpen={isYearSummaryOpen} 
        onClose={() => setIsYearSummaryOpen(false)} 
        title={`${filterYear} Monthly Breakdown`}
      >
        <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[28%]">Month</th>
                <th className="px-2 py-3 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest w-[24%] text-center">Deposit</th>
                <th className="px-2 py-3 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest w-[24%] text-center">Withdraw</th>
                <th className="px-2 py-3 text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest w-[24%] text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {monthlySummary.length > 0 ? (
                monthlySummary.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-300 text-xs truncate">{row.month}</td>
                    <td className="px-2 py-3 font-bold text-blue-600 dark:text-blue-400 text-xs text-center">৳{row.deposit.toLocaleString()}</td>
                    <td className="px-2 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-xs text-center">৳{row.withdraw.toLocaleString()}</td>
                    <td className={`px-2 py-3 font-black text-xs text-right ${row.profit < 0 ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {row.profit < 0 ? '-' : ''}৳{Math.abs(row.profit).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-300 dark:text-slate-600 italic text-xs uppercase font-bold">No activity recorded for {filterYear}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Floating Action Button */}
      <button 
        className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-light hover:scale-110 hover:bg-blue-700 active:scale-95 transition-all z-[60] group"
        onClick={openAddModal}
      >
        <span className="group-hover:rotate-90 transition-transform duration-300">+</span>
      </button>

      {/* Input Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBet ? "Edit Record" : "Add New Record"}>
        <div className="space-y-6">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button 
              onClick={() => setFormData({...formData, status: 'deposit'})}
              className={`flex-1 py-3 text-[11px] font-bold rounded-lg transition-all ${formData.status === 'deposit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Deposit
            </button>
            <button 
              onClick={() => setFormData({...formData, status: 'withdraw'})}
              className={`flex-1 py-3 text-[11px] font-bold rounded-lg transition-all ${formData.status === 'withdraw' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Withdraw
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 pl-1">Date</label>
            <input 
              type="date" 
              value={formData.date} 
              onChange={(e) => setFormData({...formData, date: e.target.value})} 
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm text-slate-800 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 pl-1">Amount (৳)</label>
            <input 
              type="number" 
              value={formData.amount || ''} 
              onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} 
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-sm text-slate-800 dark:text-white" 
              placeholder="0.00" 
            />
          </div>
          
          <button onClick={handleSave} className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs active:scale-95 mt-2 ${formData.status === 'deposit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {editingBet ? "Update Entry" : "Confirm Entry"}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Remove Record">
        <div className="text-center space-y-4 p-2">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </div>
          <p className="font-bold text-slate-800 dark:text-white">Delete this record?</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs px-4">This action cannot be undone. The record will be permanently removed.</p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button onClick={() => setIsDeleteConfirmOpen(false)} className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-[11px] uppercase tracking-widest">Cancel</button>
            <button onClick={confirmDelete} className="py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-100 dark:shadow-rose-900/20 text-[11px] uppercase tracking-widest">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
