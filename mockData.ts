
import { PayStub, SavingGoal, Bill, Bet, Reminder, Transaction } from './types';

// Helper to generate DPS schedule
const generateDPSSchedule = (): Transaction[] => {
  const schedule: Transaction[] = [];
  
  for (let year = 2022; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const mStr = month.toString().padStart(2, '0');
      let amount = 5000;
      
      // Jan and Feb 2022 are 2000 as requested
      if (year === 2022 && (month === 1 || month === 2)) {
        amount = 2000;
      }
      
      schedule.push({
        id: `dps-auto-${year}-${mStr}`,
        type: 'expense',
        category: 'DPS',
        amount: amount,
        date: `${year}-${mStr}-01`,
        description: 'Prime Bank'
      });
    }
  }
  return schedule;
};

export const MOCK_METRICS = [
  { label: 'Net Worth', value: 129500, change: 12, trend: 'up' },
  { label: 'Monthly ROI', value: 8.4, change: 2.1, trend: 'up' },
  { label: 'Credit Score', value: 742, change: 5, trend: 'up' },
  { label: 'Debt/Income', value: 18.5, change: 2, trend: 'down' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { 
    id: 't1', 
    type: 'income', 
    category: 'Salary', 
    amount: 33000, 
    date: '2026-01-08', 
    description: 'Monthly Salary' 
  },
  { 
    id: 't2', 
    type: 'expense', 
    category: 'Rent', 
    amount: 3500, 
    date: '2026-01-10', 
    description: 'House Rent' 
  },
  ...generateDPSSchedule()
];

export const MOCK_PAYROLL: PayStub[] = [
  { id: '1', gross: 75000, tax: 12000, deductions: 5000, net: 58000, date: '2023-10-31' },
  { id: '2', gross: 75000, tax: 12000, deductions: 4500, net: 58500, date: '2023-09-30' },
  { id: '3', gross: 75000, tax: 12000, deductions: 5000, net: 58000, date: '2023-08-31' },
];

export const MOCK_SAVINGS: SavingGoal[] = [
  { 
    id: '1', 
    name: 'DPS - Prime Bank', 
    target: 500000, 
    current: 185000, 
    deposit: 154000, 
    profit: 31000, 
    color: '#3b82f6', 
    startDate: '2023-01-01', 
    durationYears: 10 
  }
];

export const MOCK_BILLS: Bill[] = [
  // 2023 Historical Data
  { id: 'h23-04', name: 'Electric Bill', category: 'Electric', amount: 512, dueDate: '2023-04-01', status: 'paid' },
  { id: 'h23-05', name: 'Electric Bill', category: 'Electric', amount: 603, dueDate: '2023-05-01', status: 'paid' },
  { id: 'h23-06', name: 'Electric Bill', category: 'Electric', amount: 675, dueDate: '2023-06-01', status: 'paid' },
  { id: 'h23-07', name: 'Electric Bill', category: 'Electric', amount: 640, dueDate: '2023-07-01', status: 'paid' },
  { id: 'h23-08', name: 'Electric Bill', category: 'Electric', amount: 1023, dueDate: '2023-08-01', status: 'paid' },
  { id: 'h23-09', name: 'Electric Bill', category: 'Electric', amount: 1092, dueDate: '2023-09-01', status: 'paid' },
  { id: 'h23-10', name: 'Electric Bill', category: 'Electric', amount: 884, dueDate: '2023-10-01', status: 'paid' },
  { id: 'h23-11', name: 'Electric Bill', category: 'Electric', amount: 816, dueDate: '2023-11-01', status: 'paid' },
  { id: 'h23-12', name: 'Electric Bill', category: 'Electric', amount: 640, dueDate: '2023-12-01', status: 'paid' },

  // 2024 Historical Data
  { id: 'h24-01', name: 'Electric Bill', category: 'Electric', amount: 640, dueDate: '2024-01-01', status: 'paid' },
  { id: 'h24-02', name: 'Electric Bill', category: 'Electric', amount: 630, dueDate: '2024-02-01', status: 'paid' },
  { id: 'h24-03', name: 'Electric Bill', category: 'Electric', amount: 687, dueDate: '2024-03-01', status: 'paid' },
  { id: 'h24-04', name: 'Electric Bill', category: 'Electric', amount: 430, dueDate: '2024-04-01', status: 'paid' },
  { id: 'h24-05', name: 'Electric Bill', category: 'Electric', amount: 702, dueDate: '2024-05-01', status: 'paid' },
  { id: 'h24-06', name: 'Electric Bill', category: 'Electric', amount: 854, dueDate: '2024-06-01', status: 'paid' },
  { id: 'h24-07', name: 'Electric Bill', category: 'Electric', amount: 778, dueDate: '2024-07-01', status: 'paid' },
  { id: 'h24-08', name: 'Electric Bill', category: 'Electric', amount: 735, dueDate: '2024-08-01', status: 'paid' },
  { id: 'h24-09', name: 'Electric Bill', category: 'Electric', amount: 1005, dueDate: '2024-09-01', status: 'paid' },
  { id: 'h24-10', name: 'Electric Bill', category: 'Electric', amount: 854, dueDate: '2024-10-01', status: 'paid' },
  { id: 'h24-11', name: 'Electric Bill', category: 'Electric', amount: 929, dueDate: '2024-11-01', status: 'paid' },
  { id: 'h24-12', name: 'Electric Bill', category: 'Electric', amount: 778, dueDate: '2024-12-01', status: 'paid' },

  // 2025 Historical Data
  { id: 'h25-01', name: 'Electric Bill', category: 'Electric', amount: 627, dueDate: '2025-01-01', status: 'paid' },
  { id: 'h25-02', name: 'Electric Bill', category: 'Electric', amount: 778, dueDate: '2025-02-01', status: 'paid' },
  { id: 'h25-03', name: 'Electric Bill', category: 'Electric', amount: 551, dueDate: '2025-03-01', status: 'paid' },
  { id: 'h25-04', name: 'Electric Bill', category: 'Electric', amount: 551, dueDate: '2025-04-01', status: 'paid' },
  { id: 'h25-05', name: 'Electric Bill', category: 'Electric', amount: 1005, dueDate: '2025-05-01', status: 'paid' },
  { id: 'h25-06', name: 'Electric Bill', category: 'Electric', amount: 705, dueDate: '2025-06-01', status: 'paid' },
  { id: 'h25-07', name: 'Electric Bill', category: 'Electric', amount: 700, dueDate: '2025-07-01', status: 'paid' },
  { id: 'h25-08', name: 'Electric Bill', category: 'Electric', amount: 700, dueDate: '2025-08-01', status: 'paid' },
  { id: 'h25-09', name: 'Electric Bill', category: 'Electric', amount: 700, dueDate: '2025-09-01', status: 'paid' },
  { id: 'h25-10', name: 'Electric Bill', category: 'Electric', amount: 550, dueDate: '2025-10-01', status: 'paid' },
  { id: 'h25-11', name: 'Electric Bill', category: 'Electric', amount: 550, dueDate: '2025-11-01', status: 'paid' },
  { id: 'h25-12', name: 'Electric Bill', category: 'Electric', amount: 550, dueDate: '2025-12-01', status: 'paid' },

];

export const MOCK_BETS: Bet[] = [
  { id: '1', event: 'World Cup Final', amount: 1000, odds: 2.5, status: 'won', potentialReturn: 2500, date: '2023-10-20' },
  { id: '2', event: 'Tennis Open', amount: 500, odds: 1.8, status: 'lost', potentialReturn: 900, date: '2023-10-22' },
  { id: '3', event: 'Tech Stock Option', amount: 5000, odds: 1.5, status: 'pending', potentialReturn: 7500, date: '2023-11-05' },
];

export const MOCK_REMINDERS: Reminder[] = [
  { id: '1', title: 'Prime Bank DPS Payment', date: '2025-01-01', priority: 'high', completed: false },
  { id: '2', title: 'Internet Bill Renewal', date: '2025-01-05', priority: 'medium', completed: false },
  { id: '3', title: 'Submit Income Tax Documents', date: '2025-02-15', priority: 'high', completed: false },
  { id: '4', title: 'Quarterly Budget Planning', date: '2024-12-31', priority: 'low', completed: true },
  { id: '5', title: 'Vehicle Insurance Check', date: '2025-03-20', priority: 'medium', completed: false },
];
