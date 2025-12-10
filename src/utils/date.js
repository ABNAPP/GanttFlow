// Date utility functions
// Source: src/utils/helpers.js (date-related functions)

/**
 * Format date to YYYY-MM-DD string
 * Source: src/utils/helpers.js - formatDate
 */
export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Get array of days between two dates
 * Source: src/utils/helpers.js - getDaysArray
 */
export const getDaysArray = (start, end) => {
  const arr = [];
  const dt = new Date(start);
  const endDate = new Date(end);
  while (dt <= endDate) {
    arr.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
};

/**
 * Get holiday name for a date
 * Source: src/utils/helpers.js - getHolidayName
 */
export const getHolidayName = (date, lang) => {
  const d = date.getDate();
  const m = date.getMonth() + 1;
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
 * Check if date is a red day (weekend or holiday)
 * Source: src/utils/helpers.js - isRedDay
 */
export const isRedDay = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6 || getHolidayName(date, 'sv') !== null;
};
