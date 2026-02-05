
import React from 'react';
import { ICONS } from './constants';

export const formatDate = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dateStr;
};

export const formatTo12Hr = (time24: string) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getCategoryIcon = (category: string, color?: string) => {
  const cat = category.toLowerCase();
  const props = { 
    className: "w-4 h-4", 
    style: color ? { color } : {} 
  };

  if (cat.includes('food')) return React.createElement(ICONS.Food, props);
  if (cat.includes('rent')) return React.createElement(ICONS.Home, props);
  if (cat.includes('bill')) return React.createElement(ICONS.Bills, props);
  if (cat.includes('dps') || cat.includes('savings')) return React.createElement(ICONS.Savings, props);
  if (cat.includes('home')) return React.createElement(ICONS.Home, props);
  if (cat.includes('transport')) return React.createElement(ICONS.Transport, props);
  if (cat.includes('shopping')) return React.createElement(ICONS.Shopping, props);
  if (cat.includes('medical') || cat.includes('health')) return React.createElement(ICONS.Medical, props);
  if (cat.includes('salary')) return React.createElement(ICONS.Financial, { ...props, style: { color: color || '#10b981' } });
  return React.createElement(ICONS.Other, props);
};

const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBnDigits = (num: number | string) => num.toString().split('').map(d => isNaN(parseInt(d)) ? d : bnDigits[parseInt(d)]).join('');

/**
 * Combined Date Format: English Gregorian / Bengali Script Date
 * Example: Monday, 02 February 2026 / সোমবার, ১৯ মাঘ ১৪৩২
 */
export const getFullBengaliCombinedDate = (date: Date) => {
  const bnDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const bnMonths = ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'];

  // Normalize time to avoid DST/offset issues
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  // 1. Gregorian Part in English Script (English format)
  // en-GB produces "Monday, 02 February 2026"
  const enDatePart = current.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // 2. Bengali Calendar Part (Revised Bangladesh Rules)
  const gFullYear = current.getFullYear();
  const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  
  // Revised Rule: First 6 months (Boishakh to Ashwin) are 31 days.
  // Next 5 months (Kartik to Phalgun) are 30 days.
  // Phalgun is 31 days in leap year. Chaitra is 30 days.
  const bnMonthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeapYear(gFullYear) ? 31 : 30, 30];
  
  let startOfBnYear = new Date(gFullYear, 3, 14); // April 14
  startOfBnYear.setHours(0, 0, 0, 0);

  let diffInDays = Math.round((current.getTime() - startOfBnYear.getTime()) / (1000 * 60 * 60 * 24));
  let bnYear = gFullYear - 593;

  if (diffInDays < 0) {
    bnYear = gFullYear - 594;
    const prevYearStart = new Date(gFullYear - 1, 3, 14);
    prevYearStart.setHours(0, 0, 0, 0);
    diffInDays = Math.round((current.getTime() - prevYearStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  let bnMonthIdx = 0;
  let bnDayNum = 0;
  let remainingDays = diffInDays;

  for (let i = 0; i < 12; i++) {
    if (remainingDays < bnMonthDays[i]) {
      bnMonthIdx = i;
      bnDayNum = remainingDays + 1;
      break;
    }
    remainingDays -= bnMonthDays[i];
  }

  const bnDayName = bnDays[current.getDay()];
  const bnDayStr = toBnDigits(bnDayNum.toString().padStart(2, '0'));
  const bnMonthName = bnMonths[bnMonthIdx];
  const bnYearStr = toBnDigits(bnYear);

  // Result: Monday, 02 February 2026 / সোমবার, ১৯ মাঘ ১৪৩২
  return `${enDatePart} / ${bnDayName}, ${bnDayStr} ${bnMonthName} ${bnYearStr}`;
};

export const getBengaliDate = (date: Date) => {
  return getFullBengaliCombinedDate(date);
};

export const getEnglishDate = (date: Date) => {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
