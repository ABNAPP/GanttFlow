// Date utility functions
// Source: src/utils/helpers.js (date-related functions)
// Now using date-fns for consistent date handling

import { format, parseISO, addDays, eachDayOfInterval, getDate, getMonth, getDay } from 'date-fns';

/**
 * Format date to YYYY-MM-DD string
 * Converts a Date object or date string to ISO date format (YYYY-MM-DD)
 * 
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string in YYYY-MM-DD format
 * 
 * @example
 * formatDate(new Date(2024, 0, 15)) // Returns "2024-01-15"
 * formatDate('2024-01-15T10:30:00Z') // Returns "2024-01-15"
 */
export const formatDate = (date) => {
  let dateObj;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    // Try to parse ISO string, fallback to new Date if it fails
    try {
      dateObj = parseISO(date);
      // If parseISO returns invalid date, use new Date
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(date);
      }
    } catch {
      dateObj = new Date(date);
    }
  } else {
    // For numbers or other types, use new Date
    dateObj = new Date(date);
  }
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Get array of days between two dates (inclusive)
 * Creates an array of Date objects for each day from start to end
 * 
 * @param {Date|string} start - Start date
 * @param {Date|string} end - End date
 * @returns {Date[]} Array of Date objects for each day
 * 
 * @example
 * getDaysArray('2024-01-01', '2024-01-03')
 * // Returns [Date(2024-01-01), Date(2024-01-02), Date(2024-01-03)]
 */
export const getDaysArray = (start, end) => {
  let startDate, endDate;
  
  if (start instanceof Date) {
    startDate = start;
  } else if (typeof start === 'string') {
    try {
      startDate = parseISO(start);
      if (isNaN(startDate.getTime())) {
        startDate = new Date(start);
      }
    } catch {
      startDate = new Date(start);
    }
  } else {
    startDate = new Date(start);
  }
  
  if (end instanceof Date) {
    endDate = end;
  } else if (typeof end === 'string') {
    try {
      endDate = parseISO(end);
      if (isNaN(endDate.getTime())) {
        endDate = new Date(end);
      }
    } catch {
      endDate = new Date(end);
    }
  } else {
    endDate = new Date(end);
  }
  
  return eachDayOfInterval({ start: startDate, end: endDate });
};

/**
 * Get holiday name for a date (Swedish holidays)
 * Returns the name of a Swedish holiday if the date matches, otherwise null
 * 
 * @param {Date} date - Date to check
 * @param {string} lang - Language code ('sv' for Swedish, 'en' for English)
 * @returns {string|null} Holiday name or null if not a holiday
 * 
 * @example
 * getHolidayName(new Date(2024, 0, 1), 'sv') // Returns "Nyårsdagen"
 * getHolidayName(new Date(2024, 0, 2), 'sv') // Returns null
 */
export const getHolidayName = (date, lang) => {
  let dateObj;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    try {
      dateObj = parseISO(date);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(date);
      }
    } catch {
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }
  
  const d = getDate(dateObj);
  const m = getMonth(dateObj) + 1; // getMonth returns 0-11, so add 1
  if (m === 1 && d === 1)
    return lang === 'sv' ? 'Nyårsdagen' : "New Year's Day";
  if (m === 1 && d === 6)
    return lang === 'sv' ? 'Trettondedag' : 'Epiphany';
  if (m === 5 && d === 1)
    return lang === 'sv' ? 'Första maj' : 'May 1st';
  if (m === 6 && d === 6)
    return lang === 'sv' ? 'Nationaldagen' : 'National Day';
  if (m === 12 && d === 24)
    return lang === 'sv' ? 'Julafton' : 'Xmas Eve';
  if (m === 12 && d === 25)
    return lang === 'sv' ? 'Juldagen' : 'Xmas Day';
  if (m === 12 && d === 26)
    return lang === 'sv' ? 'Annandag jul' : 'Boxing Day';
  if (m === 12 && d === 31)
    return lang === 'sv' ? 'Nyårsafton' : "New Year's Eve";
  return null;
};

/**
 * Check if date is a red day (weekend or Swedish holiday)
 * Red days are weekends (Saturday/Sunday) or Swedish holidays
 * 
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is a weekend or holiday
 * 
 * @example
 * isRedDay(new Date(2024, 0, 1)) // Returns true (New Year's Day)
 * isRedDay(new Date(2024, 0, 6)) // Returns true (Saturday)
 * isRedDay(new Date(2024, 0, 2)) // Returns false (weekday)
 */
export const isRedDay = (date) => {
  let dateObj;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    try {
      dateObj = parseISO(date);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(date);
      }
    } catch {
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }
  
  const day = getDay(dateObj); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6 || getHolidayName(dateObj, 'sv') !== null;
};
