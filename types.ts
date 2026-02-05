
import React from 'react';

export type ViewType = 'dashboard' | 'financial' | 'payroll' | 'savings' | 'bills' | 'betting' | 'reminders' | 'settings' | 'history';
export type LanguageType = 'en' | 'bn';
export type ThemeType = 'light' | 'dark';

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  backupEmail?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface Bill {
  id: string;
  name: string;
  category: 'Electric' | 'Wifi';
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface SavingGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deposit: number;
  profit: number;
  color: string;
  startDate: string;
  durationYears: number;
  deadline?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  bank: string;
  plan: string;
  target: number;
  maturity: number;
  progress: number;
  completed: number;
  total: number;
  durationCompleted: string;
  durationRemaining: string;
}

// Added SummaryData interface as it was missing and referenced in SummaryCard component
export interface SummaryData {
  title: string;
  value: number;
  change: number;
  type: 'income' | 'expense' | 'balance';
}

export interface Bet {
  id: string;
  event: string;
  amount: number;
  odds?: number;
  potentialReturn?: number;
  status: 'won' | 'lost' | 'pending';
  date: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  daysRemaining?: number;
}

export interface PayStub {
  id: string;
  gross: number;
  tax: number;
  deductions?: number;
  net: number;
  date: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}
