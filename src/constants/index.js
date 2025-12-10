// Zoom levels configuration
export const ZOOM_LEVELS = {
  day: { cellWidth: 40, label: 'Day' },
  week: { cellWidth: 20, label: 'Week' },
  month: { cellWidth: 10, label: 'Month' }
};

// Default values
export const DEFAULT_VIEW_DAYS = 45;
export const DEFAULT_WARNING_THRESHOLD = 1;
export const DEFAULT_WARNING_MAX = 14;

// Status values
export const STATUSES = {
  PLANERAD: 'Planerad',
  PAGENDE: 'Pågående',
  KLAR: 'Klar',
  FORSENAD: 'Försenad'
};

// Role keys
export const ROLES = {
  ASSIGNEE: 'assignee',
  EXECUTOR: 'executor',
  CAD: 'cad',
  REVIEWER: 'reviewer',
  AGENT: 'agent',
  BE: 'be',
  PL: 'pl'
};

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: 768
};

// Drag threshold (pixels before drag is considered intentional)
export const DRAG_THRESHOLD = 5;


