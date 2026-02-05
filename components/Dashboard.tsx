
import React from 'react';
import { Calendar, TrendingUp, TrendingDown, PlusCircle } from 'lucide-react';
import StatCard from './StatCard';
import SavingsGoalCard from './SavingsGoalCard';
import ExpenseChart from './ExpenseChart';
import HolidayCard from './HolidayCard';
import ReminderItem from './ReminderItem';

const Dashboard: React.FC = () => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex items-center gap-2 text-slate-500 font-medium dark:text-slate-400">
        <Calendar size={18} />
        <span>{dateStr} / {new Intl.DateTimeFormat('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(today)}</span>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="TOTAL INCOME" 
          value={125000} 
          change={12.5} 
          color="green" 
          icon={<TrendingUp size={20} />}
        />
        <StatCard 
          label="TOTAL EXPENSE" 
          value={45600} 
          change={-5.2} 
          color="red" 
          icon={<TrendingDown size={20} />}
        />
        <StatCard 
          label="BALANCE" 
          value={79400} 
          change={8.1} 
          color="blue" 
          icon={<TrendingUp size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Savings Progress */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase border-l-4 border-blue-600 pl-3">
                Savings Goals Progress
              </h3>
              <button className="text-blue-600 hover:text-blue-700 text-xs font-bold uppercase tracking-wider">
                View All
              </button>
            </div>
            <SavingsGoalCard 
              goal={{
                id: '1',
                title: 'DPS - PRIME BANK',
                bank: 'PRIME BANK',
                plan: '10 YEARS PLAN • GOAL TARGETED',
                target: 600000,
                maturity: 895212,
                progress: 30,
                completed: 48,
                total: 72,
                durationCompleted: '4 YEARS 0 MONTH',
                durationRemaining: '6 YEARS 0 MONTH'
              }}
            />
          </section>

          {/* Reminders */}
          <section>
             <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase border-l-4 border-indigo-600 pl-3">
                Upcoming Reminders
              </h3>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 space-y-3">
              <ReminderItem 
                // Changed dueDate to date and status to priority to match Reminder interface
                reminder={{ id: 'r1', title: 'Monthly Rent Payment', date: '2026-02-10', priority: 'high', completed: false }} 
              />
              <ReminderItem 
                // Changed dueDate to date and status to priority to match Reminder interface
                reminder={{ id: 'r2', title: 'Internet Bill', date: '2026-02-15', priority: 'medium', completed: false }} 
              />
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Expense Breakdown */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase border-l-4 border-emerald-500 pl-3">
                Monthly Expense Breakdown
              </h3>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 min-h-[300px] flex items-center justify-center dark:bg-slate-800 dark:border-slate-700">
              <ExpenseChart />
            </div>
          </section>

          {/* Public Holidays */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase border-l-4 border-rose-500 pl-3">
                Public Holiday
              </h3>
              <button className="bg-rose-500 p-1 text-white rounded-md hover:bg-rose-600 transition-colors">
                <PlusCircle size={16} />
              </button>
            </div>
            <HolidayCard 
              holiday={{ id: 'h1', name: 'Shaheed Day', date: '21-02-2026', daysRemaining: 16 }}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
