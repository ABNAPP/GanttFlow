// Simple toast notification system
let toastContainer = null;

export const initToast = () => {
  if (typeof document !== 'undefined' && !toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-[200] flex flex-col gap-2';
    document.body.appendChild(toastContainer);
  }
};

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

export const showError = (message) => showToast(message, 'error');
export const showSuccess = (message) => showToast(message, 'success');
export const showWarning = (message) => showToast(message, 'warning');
export const showInfo = (message) => showToast(message, 'info');


