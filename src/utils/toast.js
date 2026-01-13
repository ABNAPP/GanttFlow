// Simple toast notification system
let toastContainer = null;

/**
 * Initializes the toast notification container
 * Creates a fixed container element in the DOM if it doesn't exist
 * @returns {void}
 */
export const initToast = () => {
  if (typeof document !== 'undefined' && !toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-[200] flex flex-col gap-2';
    document.body.appendChild(toastContainer);
  }
};

/**
 * Shows a toast notification
 * Creates and displays a temporary notification message with auto-dismiss
 * 
 * @param {string} message - Message to display
 * @param {'success'|'error'|'warning'|'info'} type - Toast type (default: 'info')
 * @param {number} duration - Display duration in milliseconds (default: 3000)
 * @returns {void}
 * 
 * @example
 * showToast('Task saved successfully', 'success', 2000);
 * showToast('Error occurred', 'error');
 */
export const showToast = (message, type = 'info', duration = 3000) => {
  initToast();
  
  const toast = document.createElement('div');
  const bgColor = {
    success: 'bg-green-500 dark:bg-green-600',
    error: 'bg-red-500 dark:bg-red-600',
    warning: 'bg-yellow-500 dark:bg-yellow-600',
    info: 'bg-blue-500 dark:bg-blue-600'
  }[type] || 'bg-gray-500 dark:bg-gray-600';
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-[250px] max-w-md transform transition-all duration-300 translate-x-full opacity-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  toast.innerHTML = `
    <span class="flex-shrink-0 text-lg font-semibold">${icons[type] || ''}</span>
    <span class="flex-1 text-sm font-medium">${message}</span>
    <button 
      class="ml-auto text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded p-1 transition-colors" 
      onclick="this.parentElement.remove()"
      aria-label="Close notification"
    >×</button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });
  
  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.transform = 'translateX(full)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }
  }, duration);
};

/**
 * Shows an error toast notification
 * @param {string} message - Error message to display
 * @returns {void}
 */
export const showError = (message) => showToast(message, 'error');

/**
 * Shows a success toast notification
 * @param {string} message - Success message to display
 * @returns {void}
 */
export const showSuccess = (message) => showToast(message, 'success');

/**
 * Shows a warning toast notification
 * @param {string} message - Warning message to display
 * @returns {void}
 */
export const showWarning = (message) => showToast(message, 'warning');

/**
 * Shows an info toast notification
 * @param {string} message - Info message to display
 * @returns {void}
 */
export const showInfo = (message) => showToast(message, 'info');


