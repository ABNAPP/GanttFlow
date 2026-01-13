/**
 * XSS Protection utilities
 * Sanitizes user input to prevent XSS attacks
 */

/**
 * Sanitizes a string by escaping HTML special characters
 * This prevents XSS attacks when rendering user input
 * @param {string} input - The string to sanitize
 * @returns {string} - Sanitized string safe for rendering
 */
export const sanitizeText = (input) => {
  if (typeof input !== 'string') {
    return String(input || '');
  }

  // Escape HTML special characters
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes an object's string properties recursively
 * Useful for sanitizing task data, comments, etc.
 * @param {any} obj - Object to sanitize
 * @param {string[]} excludeKeys - Keys to exclude from sanitization (e.g., 'id', 'createdAt')
 * @returns {any} - Sanitized object
 */
export const sanitizeObject = (obj, excludeKeys = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'startDate', 'endDate']) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, excludeKeys));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (excludeKeys.includes(key)) {
        // Don't sanitize excluded keys (they're not user input)
        sanitized[key] = value;
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      } else {
        sanitized[key] = sanitizeObject(value, excludeKeys);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validates and sanitizes user input for text fields
 * Removes dangerous characters and limits length
 * @param {string} input - Input to validate and sanitize
 * @param {number} maxLength - Maximum allowed length (default: 10000)
 * @returns {string} - Validated and sanitized string
 */
export const validateAndSanitizeInput = (input, maxLength = 10000) => {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
};

/**
 * Sanitizes HTML content (for future use if needed)
 * Currently just escapes HTML, but could be extended to allow safe HTML tags
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') {
    return '';
  }

  // For now, just escape all HTML
  // In the future, could use DOMPurify or similar for safe HTML
  return sanitizeText(html);
};
