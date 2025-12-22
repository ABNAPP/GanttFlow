/**
 * Data validation utilities for Firestore data
 * Ensures backward compatibility and handles missing fields gracefully
 */

import { generateId } from './helpers';

/**
 * Validates and normalizes a checklist item
 * @param {any} item - Raw checklist item from Firestore
 * @param {number} index - Index for fallback ID generation
 * @returns {import('../types').ChecklistItem}
 */
export const validateChecklistItem = (item, index = 0) => {
  if (!item || typeof item !== 'object') {
    console.warn('Invalid checklist item:', item);
    return {
      id: generateId(),
      text: '',
      done: false,
      startDate: null,
      endDate: null,
      executor: null,
      priority: 'normal', // Default priority
    };
  }

  // Handle priority: support both 'priority' and 'prioritet' (backward compatibility)
  // Normalize to standard format: 'low', 'normal', 'high'
  let priority = item.priority || item.prioritet || 'normal';
  if (typeof priority === 'string') {
    priority = priority.trim().toLowerCase();
    // Map Swedish to English for consistency
    if (priority === 'hög' || priority === 'hog') priority = 'high';
    else if (priority === 'låg' || priority === 'lag') priority = 'low';
    else if (priority === 'normal') priority = 'normal';
    else if (priority !== 'high' && priority !== 'low') priority = 'normal'; // Default unknown to normal
  } else {
    priority = 'normal';
  }

  return {
    id: item.id || generateId(),
    text: typeof item.text === 'string' ? item.text : '',
    done: Boolean(item.done),
    startDate: item.startDate && typeof item.startDate === 'string' ? item.startDate : null,
    endDate: item.endDate && typeof item.endDate === 'string' ? item.endDate : null,
    executor: item.executor && typeof item.executor === 'string' ? item.executor.trim() : null,
    priority: priority, // Always include priority field
  };
};

/**
 * Validates and normalizes a task from Firestore
 * Sets default values for missing fields (backward compatibility)
 * @param {any} data - Raw task data from Firestore
 * @param {string} id - Task ID
 * @returns {import('../types').Task}
 */
export const validateTask = (data, id) => {
  if (!data || typeof data !== 'object') {
    console.error('Invalid task data:', data);
    throw new Error('Invalid task data structure');
  }

  // Validate required fields
  const requiredFields = ['client', 'title', 'phase', 'startDate', 'endDate', 'status'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    console.warn(`Task ${id} missing required fields:`, missingFields);
  }

  // Normalize checklist
  const checklist = Array.isArray(data.checklist)
    ? data.checklist.map((item, idx) => validateChecklistItem(item, idx))
    : [];

  // NOTE: Priority exists ONLY on subtasks (checklist items), NOT on main tasks
  // If old data contains task.priority, ignore it completely

  // Validate tags
  const tags = Array.isArray(data.tags) 
    ? data.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    : [];

  // Validate status
  const validStatuses = ['Planerad', 'Pågående', 'Klar', 'Försenad'];
  const status = validStatuses.includes(data.status) ? data.status : 'Planerad';

  // Validate comments - ensure it's always an array
  const comments = Array.isArray(data.comments)
    ? data.comments.map((comment) => {
        // Ensure each comment has required fields
        if (!comment || typeof comment !== 'object') {
          return null; // Skip invalid comments
        }
        return {
          id: comment.id || generateId(),
          text: typeof comment.text === 'string' ? comment.text : '',
          createdAt: comment.createdAt && typeof comment.createdAt === 'string' ? comment.createdAt : new Date().toISOString(),
          author: comment.author && typeof comment.author === 'string' ? comment.author.trim() : null,
        };
      }).filter(Boolean) // Remove null entries
    : [];

  return {
    id: id || data.id || generateId(),
    client: typeof data.client === 'string' ? data.client : '',
    title: typeof data.title === 'string' ? data.title : '',
    phase: typeof data.phase === 'string' ? data.phase : '',
    assignee: data.assignee && typeof data.assignee === 'string' ? data.assignee.trim() : null,
    cad: data.cad && typeof data.cad === 'string' ? data.cad.trim() : null,
    reviewer: data.reviewer && typeof data.reviewer === 'string' ? data.reviewer.trim() : null,
    agent: data.agent && typeof data.agent === 'string' ? data.agent.trim() : null,
    be: data.be && typeof data.be === 'string' ? data.be.trim() : null,
    pl: data.pl && typeof data.pl === 'string' ? data.pl.trim() : null,
    executor: data.executor && typeof data.executor === 'string' ? data.executor.trim() : null,
    startDate: typeof data.startDate === 'string' ? data.startDate : '',
    endDate: typeof data.endDate === 'string' ? data.endDate : '',
    status,
    checklist,
    tags,
    comments, // Always include comments as an array
    // Priority exists ONLY on subtasks, not on main tasks
    deleted: Boolean(data.deleted),
    deletedAt: data.deletedAt && typeof data.deletedAt === 'string' ? data.deletedAt : null,
    createdAt: data.createdAt && typeof data.createdAt === 'string' ? data.createdAt : null,
  };
};

/**
 * Validates an array of tasks
 * @param {any[]} tasksData - Array of raw task data
 * @returns {import('../types').Task[]}
 */
export const validateTasks = (tasksData) => {
  if (!Array.isArray(tasksData)) {
    console.warn('Invalid tasks data: expected array, got', typeof tasksData);
    return [];
  }

  return tasksData
    .map((task, index) => {
      try {
        return validateTask(task, task.id || `task-${index}`);
      } catch (error) {
        console.error(`Error validating task at index ${index}:`, error, task);
        return null;
      }
    })
    .filter(Boolean); // Remove null entries
};

