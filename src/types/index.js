/**
 * Type definitions for the Gantt application
 * Using JSDoc for type annotations (compatible with JavaScript)
 */

/**
 * @typedef {Object} ChecklistItem
 * @property {string} id - Unique identifier
 * @property {string} text - Task description
 * @property {boolean} done - Completion status
 * @property {string|null} [startDate] - Start date (YYYY-MM-DD)
 * @property {string|null} [endDate] - End date (YYYY-MM-DD)
 * @property {string|null} [executor] - Executor (HL) name
 */

/**
 * @typedef {('low'|'normal'|'high')} Priority
 */

/**
 * @typedef {('Planerad'|'Pågående'|'Klar'|'Försenad')} TaskStatus
 */

/**
 * @typedef {Object} Task
 * @property {string} id - Unique identifier
 * @property {string} client - Client name
 * @property {string} title - Task title
 * @property {string} phase - Phase name
 * @property {string} [assignee] - UA role
 * @property {string} [cad] - CAD role
 * @property {string} [reviewer] - Reviewer role
 * @property {string} [agent] - Agent role
 * @property {string} [be] - BE role
 * @property {string} [pl] - PL role
 * @property {string} startDate - Start date (YYYY-MM-DD)
 * @property {string} endDate - End date (YYYY-MM-DD)
 * @property {TaskStatus} status - Task status
 * @property {ChecklistItem[]} [checklist] - Subtasks/checklist items
 * @property {string[]} [tags] - Tags array
 * @property {Priority} [priority] - Priority level
 * @property {boolean} [deleted] - Deletion flag
 * @property {string|null} [deletedAt] - Deletion timestamp
 * @property {string} [createdAt] - Creation timestamp
 */

/**
 * @typedef {Object} Backup
 * @property {string} id - Backup identifier
 * @property {string} name - Backup name
 * @property {number} timestamp - Creation timestamp
 * @property {Task[]} tasks - Array of tasks
 */

/**
 * @typedef {Object} FilterState
 * @property {string|null} [client] - Client filter
 * @property {string|null} [phase] - Phase filter
 * @property {TaskStatus|null} [status] - Status filter
 * @property {string[]} [roles] - Roles filter array
 * @property {string[]} [tags] - Tags filter array
 */

/**
 * @typedef {Object} SavedView
 * @property {string} name - View name
 * @property {FilterState} filters - Filter configuration
 * @property {string} zoomLevel - Zoom level (day/week/month)
 * @property {number} timestamp - Creation timestamp
 */

/**
 * @typedef {Object} TimelineConfig
 * @property {Date} viewStart - Start date of view
 * @property {number} viewDays - Number of days to display
 * @property {string} zoomLevel - Zoom level (day/week/month)
 * @property {number} cellWidth - Width of each cell in pixels
 */

/**
 * @typedef {Object} TaskFilters
 * @property {FilterState} filters - Current filter state
 * @property {(filters: FilterState) => void} setFilters - Update filters
 * @property {() => void} clearFilters - Clear all filters
 * @property {SavedView[]} savedViews - Saved view configurations
 * @property {(view: SavedView) => void} saveView - Save current view
 * @property {(viewName: string) => void} loadView - Load a saved view
 * @property {(viewName: string) => void} deleteView - Delete a saved view
 */

/**
 * @typedef {Object} UseTasksReturn
 * @property {Task[]} tasks - All tasks
 * @property {Task[]} archivedTasks - Completed tasks
 * @property {Task[]} deletedTasks - Deleted tasks
 * @property {boolean} loading - Loading state
 * @property {Error|null} error - Error state
 * @property {() => Promise<void>} retry - Retry failed operation
 * @property {(task: Partial<Task>) => Promise<void>} createTask - Create new task
 * @property {(taskId: string, updates: Partial<Task>) => Promise<void>} updateTask - Update task
 * @property {(taskId: string) => Promise<void>} deleteTask - Move task to trash
 * @property {(taskId: string) => Promise<void>} permanentDeleteTask - Permanently delete task
 * @property {(taskId: string) => Promise<void>} restoreTask - Restore from trash
 * @property {(taskId: string) => Promise<void>} restoreTaskStatus - Restore from archive
 * @property {Backup[]} cloudBackups - Cloud backups
 * @property {boolean} loadingBackups - Backups loading state
 * @property {() => Promise<void>} createCloudBackup - Create cloud backup
 * @property {(backupId: string) => Promise<void>} restoreCloudBackup - Restore from cloud backup
 * @property {() => string} exportData - Export to JSON
 * @property {(jsonString: string) => Promise<void>} importData - Import from JSON
 */

export {};

