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
 * Get display status for a task (SINGLE SOURCE OF TRUTH for status display)
 * This function is used EVERYWHERE in UI to ensure consistent status display
 * 
 * Rules:
 * A) If task is Klar/done => return "Klar" (oavsett datum)
 * B) Else if endDate exists and endDate < today (day-level comparison) => "Försenad" (reason: "dateOverdue")
 * C) Else => task.status (fallback to "Planerad" if missing) (reason: "stored")
 * 
 * IMPORTANT: 'Försenad' is NEVER saved to task.status. It's only for display.
 * 
 * @param {Object} task - Task object
 * @param {Date} nowDate - Current date (defaults to new Date())
 * @returns {Object} { status: string, reason: string }
 *   - status: "Planerad" | "Pågående" | "Klar" | "Försenad"
 *   - reason: "dateOverdue" | "stored"
 */
export const getTaskDisplayStatus = (task, nowDate = new Date()) => {
  if (!task) return { status: 'Planerad', reason: 'stored' };
  
  const rawStatus = task.status || 'Planerad';
  const normalizedStatus = rawStatus.toLowerCase();
  
  // Rule A: If task is "Klar", always return "Klar"
  if (checkIsDone(normalizedStatus)) {
    return { status: 'Klar', reason: 'stored' };
  }
  
  // Rule B: Check if task is overdue based on endDate (day-level comparison)
  if (task.endDate) {
    const end = new Date(task.endDate);
    const today = new Date(nowDate);
    
    // Normalize to day-level (YYYY-MM-DD) for stable comparison
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // If endDate < today and task is not done => display "Försenad"
    if (end < today) {
      return { status: 'Försenad', reason: 'dateOverdue' };
    }
  }
  
  // Rule C: Return raw status (normalized to standard format)
  if (normalizedStatus.includes('planerad') || normalizedStatus.includes('planned')) {
    return { status: 'Planerad', reason: 'stored' };
  }
  if (normalizedStatus.includes('pågående') || normalizedStatus.includes('progress')) {
    return { status: 'Pågående', reason: 'stored' };
  }
  if (normalizedStatus.includes('försenad') || normalizedStatus.includes('delayed')) {
    return { status: 'Försenad', reason: 'stored' };
  }
  
  // Default fallback
  return { status: 'Planerad', reason: 'stored' };
};

/**
 * Normalize subtask priority to standard format: 'Hög', 'Normal', or 'Låg'
 * Single source of truth for subtask priority normalization
 * IMPORTANT: Priority exists ONLY on subtasks (checklist items), NOT on main tasks
 * 
 * @param {Object|string} subtaskOrPriority - Checklist item/subtask object OR raw priority string
 * @returns {string} Normalized priority: 'Hög', 'Normal', or 'Låg' (default)
 */
export const normalizeSubtaskPriority = (subtaskOrPriority) => {
  if (!subtaskOrPriority) return 'Normal';
  
  // If it's a string, treat it as raw priority
  if (typeof subtaskOrPriority === 'string') {
    const normalized = subtaskOrPriority.trim().toLowerCase();
    if (normalized === 'high' || normalized === 'hög' || normalized === 'hog') {
      return 'Hög';
    }
    if (normalized === 'low' || normalized === 'låg' || normalized === 'lag') {
      return 'Låg';
    }
    // Default to Normal for 'normal' or any unknown value
    return 'Normal';
  }
  
  // If it's an object (subtask), read from priority or prioritet
  if (typeof subtaskOrPriority === 'object') {
    // Read from subtask.priority (primary) or subtask.prioritet (backward compatibility)
    const rawPriority = subtaskOrPriority.priority || subtaskOrPriority.prioritet;
    if (!rawPriority) return 'Normal';
    
    const normalized = String(rawPriority).trim().toLowerCase();
    
    // Map to Swedish standard: Hög, Normal, Låg
    if (normalized === 'high' || normalized === 'hög' || normalized === 'hog') {
      return 'Hög';
    }
    if (normalized === 'low' || normalized === 'låg' || normalized === 'lag') {
      return 'Låg';
    }
    // Default to Normal for 'normal' or any unknown value
    return 'Normal';
  }
  
  // Fallback
  return 'Normal';
};

/**
 * Check if a subtask (checklist item) is active (should be counted in Priority Distribution and Belastning)
 * Single source of truth for subtask filtering
 * 
 * This function matches UI's real behavior:
 * - Excludes subtasks marked as done/checked (item.done === true)
 * - Excludes subtasks that are deleted (item.deleted === true, if field exists)
 * - Excludes subtasks that are archived (item.archived === true, if field exists)
 * 
 * @param {Object} subtask - Checklist item/subtask object
 * @returns {boolean} - True if subtask is active (should be counted)
 */
export const isActiveSubtask = (subtask) => {
  if (!subtask || typeof subtask !== 'object') {
    // Fail-safe: if subtask is invalid, don't count it
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.warn('[isActiveSubtask] Invalid subtask:', subtask);
    }
    return false;
  }
  
  // Exclude done/checked subtasks
  if (subtask.done === true) {
    return false;
  }
  
  // Exclude deleted subtasks (if field exists)
  if (subtask.deleted === true) {
    return false;
  }
  
  // Exclude archived subtasks (if field exists)
  if (subtask.archived === true) {
    return false;
  }
  
  // All checks passed - subtask is active
  return true;
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
