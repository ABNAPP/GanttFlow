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

export const showToast = (message, type = 'info') => {
  initToast();
  
  const toast = document.createElement('div');
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type] || 'bg-gray-500';
  
  toast.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 min-w-[200px] animate-in slide-in-from-right duration-300`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-auto text-white hover:text-gray-200" onclick="this.parentElement.remove()">×</button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
};

export const showError = (message) => showToast(message, 'error');
export const showSuccess = (message) => showToast(message, 'success');
export const showWarning = (message) => showToast(message, 'warning');
export const showInfo = (message) => showToast(message, 'info');


