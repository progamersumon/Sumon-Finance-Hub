
import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';

const data = [
  { name: 'Rent', value: 20000 },
  { name: 'Utilities', value: 5000 },
  { name: 'Groceries', value: 8000 },
  { name: 'Eating Out', value: 3600 },
  { name: 'Entertainment', value: 4000 },
  { name: 'Travel', value: 5000 },
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ExpenseChart: React.FC = () => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-300 font-bold uppercase tracking-[0.2em] italic">
        No Expenses This Month
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[250px] flex flex-col items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 w-full max-w-xs">
        {data.slice(0, 4).map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseChart;
