
import { PayStub, SavingsGoal, Bill, Bet, Reminder, Transaction } from './types';

// Helper to generate DPS schedule - Updated to return empty as requested to clear all historical data
const generateDPSSchedule = (): Transaction[] => {
  return [];
};

export const MOCK_METRICS = [
  { label: 'Net Worth', value: 0, change: 0, trend: 'up' },
  { label: 'Monthly ROI', value: 0, change: 0, trend: 'up' },
  { label: 'Credit Score', value: 742, change: 0, trend: 'up' },
  { label: 'Debt/Income', value: 0, change: 0, trend: 'down' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const MOCK_PAYROLL: PayStub[] = [];

export const MOCK_SAVINGS: SavingsGoal[] = [
  { 
    id: '1', 
    name: 'DPS - Prime Bank', 
    plan: '৳5000/Mo',
    targetAmount: 500000, 
    currentAmount: 0, 
    maturityValue: 650000,
    color: '#3b82f6', 
    monthlyDeposit: 5000,
    years: 10,
    profitPercent: 7.5
  }
];

export const MOCK_BILLS: Bill[] = [];

export const MOCK_BETS: Bet[] = [];

export const MOCK_REMINDERS: Reminder[] = [
  { id: '1', title: 'Prime Bank DPS Payment', date: '2025-01-01', priority: 'high', completed: false },
  { id: '2', title: 'Internet Bill Renewal', date: '2025-01-05', priority: 'medium', completed: false },
  { id: '3', title: 'Submit Income Tax Documents', date: '2025-02-15', priority: 'high', completed: false },
];
