/**
 * Logger utility with environment-aware logging
 * Only logs in development mode, except for errors which always log
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Logs a message (only in development)
 * @param {...any} args - Arguments to log
 */
export const log = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Logs a warning (only in development)
 * @param {...any} args - Arguments to log
 */
export const warn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

/**
 * Logs an error (always logs, even in production)
 * @param {...any} args - Arguments to log
 */
export const error = (...args) => {
  console.error(...args);
};

/**
 * Logs with a prefix (only in development)
 * Useful for component-specific logging
 * @param {string} prefix - Prefix to add to log messages
 * @param {...any} args - Arguments to log
 */
export const logWithPrefix = (prefix, ...args) => {
  if (isDevelopment) {
    console.log(`[${prefix}]`, ...args);
  }
};

/**
 * Logger object with all methods
 */
export const logger = {
  log,
  warn,
  error,
  logWithPrefix,
};

export default logger;
