// Date utility functions
// Source: src/utils/helpers.js (date-related functions)

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
  return new Date(date).toISOString().split('T')[0];
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
  const day = date.getDay();
  return day === 0 || day === 6 || getHolidayName(date, 'sv') !== null;
};
