// Compatibility file - Re-exports from new modular structure
// This file maintains backward compatibility while we refactor
// Source: Original src/utils/helpers.js

// Re-export from new modular files
export { formatDate, getDaysArray, getHolidayName, isRedDay } from './date';
export {
  checkIsDone,
  getTimeStatus,
  getStatusColor,
  getStatusBorder,
  calculateChecklistProgress,
  generateId,
  validateTaskForm,
} from './task';
