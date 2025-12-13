// Task-related utility functions
// Source: src/utils/helpers.js (task-related functions)

/**
 * Check if task status indicates it's done
 * Source: src/utils/helpers.js - checkIsDone
 */
export const checkIsDone = (status) => {
  const s = (status || '').toLowerCase();
  return s.includes('klar') || s.includes('done');
};

/**
 * Get time status (overdue/warning) for a task or checklist item
 * Source: src/utils/helpers.js - getTimeStatus
 */
export const getTimeStatus = (item, thresholdDays) => {
  if (item.status && checkIsDone(item.status)) return { isOverdue: false, isWarning: false };
  if (item.done) return { isOverdue: false, isWarning: false };

  if (!item.endDate) return { isOverdue: false, isWarning: false };

  const end = new Date(item.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { isOverdue: true, isWarning: false };
  if (diffDays >= 0 && diffDays <= thresholdDays)
    return { isOverdue: false, isWarning: true };

  return { isOverdue: false, isWarning: false };
};

/**
 * Check if a task has any overdue checklist items
 * @param {Object} task - Task object with checklist array
 * @param {number} thresholdDays - Warning threshold in days
 * @returns {boolean} - True if any checklist item is overdue
 */
export const hasOverdueChecklistItems = (task, thresholdDays) => {
  if (!task.checklist || task.checklist.length === 0) return false;
  
  return task.checklist.some(item => {
    const status = getTimeStatus(item, thresholdDays);
    return status.isOverdue;
  });
};

/**
 * Get overall task status including checklist items
 * @param {Object} task - Task object
 * @param {number} thresholdDays - Warning threshold in days
 * @returns {Object} - { isOverdue, isWarning } considering both task and checklist
 */
export const getTaskOverallStatus = (task, thresholdDays) => {
  // Check main task status
  const taskStatus = getTimeStatus(task, thresholdDays);
  
  // Check if any checklist item is overdue
  const hasOverdueItems = hasOverdueChecklistItems(task, thresholdDays);
  
  // Task is overdue if main task is overdue OR any checklist item is overdue
  const isOverdue = taskStatus.isOverdue || hasOverdueItems;
  
  // Task has warning if main task has warning (but not overdue) OR any checklist item has warning
  const hasWarningItems = task.checklist && task.checklist.some(item => {
    const status = getTimeStatus(item, thresholdDays);
    return status.isWarning && !status.isOverdue;
  });
  const isWarning = (!isOverdue && (taskStatus.isWarning || hasWarningItems));
  
  return { isOverdue, isWarning };
};

/**
 * Get status color classes for task bars
 * Source: src/utils/helpers.js - getStatusColor
 */
export const getStatusColor = (status, isMilestone, isOverdue) => {
  if (isOverdue)
    return isMilestone
      ? 'bg-red-500 text-white rotate-45'
      : 'bg-red-500 text-white rounded-md';

  const base = isMilestone ? 'rotate-45' : 'rounded-md';
  const s = (status || '').toLowerCase();

  if (s.includes('klar') || s.includes('done'))
    return `bg-green-500 text-white ${base}`;
  if (s.includes('pågående') || s.includes('progress'))
    return `bg-blue-500 text-white ${base}`;
  if (s.includes('planerad') || s.includes('planned'))
    return `bg-gray-400 text-white ${base}`;
  if (s.includes('försenad') || s.includes('delayed'))
    return `bg-red-500 text-white ${base}`;

  return `bg-gray-400 text-white ${base}`;
};

/**
 * Get status border color for left border (4px) - Forbättring 4
 * Returns Tailwind color class for border-left
 */
export const getStatusBorderColor = (status, isOverdue) => {
  if (isOverdue) return 'border-l-red-500';
  
  const s = (status || '').toLowerCase();
  
  if (s.includes('klar') || s.includes('done'))
    return 'border-l-green-500'; // #22c55e
  if (s.includes('pågående') || s.includes('progress'))
    return 'border-l-blue-500'; // #3b82f6
  if (s.includes('blockerad') || s.includes('blocked') || s.includes('försenad') || s.includes('delayed'))
    return 'border-l-red-500'; // #ef4444
  
  // Att göra / Planerad - ingen färg
  return 'border-l-transparent';
};

/**
 * Get status border classes
 * Source: src/utils/helpers.js - getStatusBorder
 */
export const getStatusBorder = (status, isOverdue) => {
  if (isOverdue) return 'border-red-500';
  const s = (status || '').toLowerCase();
  if (s.includes('klar') || s.includes('done')) return 'border-green-500';
  if (s.includes('pågående') || s.includes('progress'))
    return 'border-blue-500';
  if (s.includes('planerad') || s.includes('planned'))
    return 'border-gray-400';
  if (s.includes('försenad') || s.includes('delayed'))
    return 'border-red-500';
  return 'border-gray-300';
};

/**
 * Calculate checklist progress percentage
 * Source: src/utils/helpers.js - calculateChecklistProgress
 */
export const calculateChecklistProgress = (checklist) => {
  if (!checklist || checklist.length === 0) return 0;
  const done = checklist.filter((i) => i.done).length;
  return Math.round((done / checklist.length) * 100);
};

/**
 * Generate unique ID
 * Source: src/utils/helpers.js - generateId
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`;
};

/**
 * Validate task form data
 * Source: src/utils/helpers.js - validateTaskForm
 */
export const validateTaskForm = (formData, t) => {
  const errors = [];

  if (!formData.title || !formData.title.trim()) {
    errors.push(t('errorTitleRequired') || 'Title is required');
  }

  if (!formData.startDate) {
    errors.push(t('errorStartDateRequired') || 'Start date is required');
  }

  if (!formData.endDate) {
    errors.push(t('errorEndDateRequired') || 'End date is required');
  }

  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      errors.push(t('errorEndBeforeStart') || 'End date must be after start date');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
