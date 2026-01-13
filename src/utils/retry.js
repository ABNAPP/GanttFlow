/**
 * Retry utility with exponential backoff
 * Retries failed operations with increasing delays between attempts
 * 
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.retries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried (default: retry all errors)
 * @param {boolean} options.testMode - If true, uses shorter delays for testing (default: false)
 * @returns {Promise} Result of the function call
 * @throws {Error} Last error if all retries fail
 * 
 * @example
 * // Basic usage
 * const result = await retryWithBackoff(() => addDoc(collection, data));
 * 
 * // With custom options
 * const result = await retryWithBackoff(
 *   () => updateDoc(docRef, data),
 *   { retries: 5, baseDelay: 500 }
 * );
 * 
 * // With custom retry condition
 * const result = await retryWithBackoff(
 *   () => fetchData(),
 *   {
 *     shouldRetry: (error) => error.code === 'unavailable' || error.code === 'deadline-exceeded'
 *   }
 * );
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    retries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true, // Retry all errors by default
    testMode = false,
  } = options;

  // In test mode, use much shorter delays
  const effectiveBaseDelay = testMode ? 10 : baseDelay;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === retries) {
        break;
      }

      // Calculate delay with exponential backoff: baseDelay * 2^attempt
      const delay = Math.min(
        effectiveBaseDelay * Math.pow(2, attempt),
        maxDelay
      );

      // Log retry attempt (only in development)
      if (import.meta.env.DEV) {
        console.log(
          `[Retry] Attempt ${attempt + 1}/${retries} failed, retrying in ${delay}ms...`,
          error.message || error
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries failed, throw last error
  throw lastError;
};

/**
 * Check if a Firebase error should be retried
 * Retries network errors, unavailable errors, and deadline exceeded errors
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} True if error should be retried
 */
export const shouldRetryFirebaseError = (error) => {
  if (!error) return false;

  // Firebase error codes that should be retried
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'internal',
    'resource-exhausted',
    'aborted',
    'cancelled',
  ];

  // Check if error has a code property (Firebase errors)
  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  // Check for network errors (no code, but network-related)
  if (error.message && (
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.message.includes('timeout') ||
    error.message.includes('Failed to fetch')
  )) {
    return true;
  }

  // Don't retry authentication or permission errors
  if (error.code && (
    error.code === 'permission-denied' ||
    error.code === 'unauthenticated' ||
    error.code === 'auth/requires-recent-login'
  )) {
    return false;
  }

  // Default: retry if it's a network-like error
  return error.message && (
    error.message.includes('network') ||
    error.message.includes('timeout') ||
    error.message.includes('Failed to fetch')
  );
};
