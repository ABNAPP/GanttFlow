/**
 * Task Storage abstraction layer
 * Separates demo mode (localStorage) from Firebase mode
 * This eliminates code duplication in useTasks.js
 */

import { onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { getTasksCollection, getTaskDoc, getBackupsCollection, isDemoModeAllowed } from '../config/firebase';
import { generateId } from './helpers';
import { validateTasks, validateTask } from './validation';
import { logger } from './logger';
import { showError, showSuccess } from './toast';
import { retryWithBackoff, shouldRetryFirebaseError } from './retry';
import { STATUSES } from '../constants';

/**
 * Helper function to normalize comments to always be an array
 */
const normalizeComments = (comments) => Array.isArray(comments) ? comments : [];

/**
 * Base class for task storage
 */
class BaseTaskStorage {
  constructor(user) {
    this.user = user;
  }

  async loadTasks() {
    throw new Error('loadTasks must be implemented');
  }

  async addTask(taskData) {
    throw new Error('addTask must be implemented');
  }

  async updateTask(taskId, taskData) {
    throw new Error('updateTask must be implemented');
  }

  async deleteTask(taskId) {
    throw new Error('deleteTask must be implemented');
  }

  async permanentDeleteTask(taskId) {
    throw new Error('permanentDeleteTask must be implemented');
  }

  async restoreTask(taskId) {
    throw new Error('restoreTask must be implemented');
  }

  async restoreTaskStatus(taskId) {
    throw new Error('restoreTaskStatus must be implemented');
  }
}

/**
 * LocalStorage-based task storage (for demo mode)
 */
export class LocalStorageTaskStorage extends BaseTaskStorage {
  constructor(user) {
    super(user);
    this.storageKey = 'demo-tasks';
  }

  setupListener(callback) {
    const handleStorageChange = (e) => {
      if (e.key === this.storageKey) {
        logger.logWithPrefix('LocalStorageTaskStorage', 'localStorage changed, reloading tasks');
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          try {
            const tasksData = JSON.parse(stored);
            const tasksWithIds = tasksData.map(task => ({
              ...task,
              checklist: (task.checklist || []).map(item => ({
                ...item,
                id: item.id || generateId(),
              })),
            }));
            callback(tasksWithIds);
          } catch (err) {
            logger.error('Error parsing updated tasks:', err);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }

  async loadTasks() {
    if (!isDemoModeAllowed()) {
      throw new Error('Demo mode is disabled in production. Please log in with email/password.');
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const tasksData = JSON.parse(stored);
        const validatedTasks = validateTasks(tasksData);
        logger.logWithPrefix('LocalStorageTaskStorage', 'Loaded tasks from localStorage:', validatedTasks.length);
        return validatedTasks;
      }
      logger.logWithPrefix('LocalStorageTaskStorage', 'No tasks found in localStorage');
      return [];
    } catch (error) {
      logger.error('Error loading from localStorage:', error);
      throw error;
    }
  }

  async addTask(taskData) {
    if (!isDemoModeAllowed()) {
      throw new Error('Demo mode is disabled in production. Please log in with email/password.');
    }

    try {
      // Always read from localStorage to avoid stale state
      const stored = localStorage.getItem(this.storageKey);
      let currentTasks = [];
      if (stored) {
        try {
          currentTasks = JSON.parse(stored);
          logger.logWithPrefix('LocalStorageTaskStorage', 'Loaded existing tasks from localStorage:', currentTasks.length);
        } catch (e) {
          logger.error('Error parsing stored tasks:', e);
          currentTasks = [];
        }
      }

      // Remove priority from task data - priority exists ONLY on subtasks (checklist items)
      const { priority, ...taskDataWithoutPriority } = taskData;

      // Normalize comments and ensure each has an id
      const normalizedComments = normalizeComments(taskData.comments).map(c => ({
        id: c.id || generateId(),
        text: typeof c.text === 'string' ? c.text : '',
        createdAt: c.createdAt && typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
        author: c.author && typeof c.author === 'string' ? c.author.trim() : null,
      }));

      const newTask = {
        id: 'demo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        ...taskDataWithoutPriority,
        tags: taskData.tags || [],
        comments: normalizedComments,
        createdAt: new Date().toISOString(),
      };

      const updatedTasks = [...currentTasks, newTask];
      logger.logWithPrefix('LocalStorageTaskStorage', 'Saving to localStorage, total tasks:', updatedTasks.length);
      localStorage.setItem(this.storageKey, JSON.stringify(updatedTasks));

      logger.logWithPrefix('LocalStorageTaskStorage', 'Task added to localStorage with ID:', newTask.id);
      return newTask.id;
    } catch (error) {
      logger.error('Error adding task to localStorage:', error);
      throw error;
    }
  }

  async updateTask(taskId, taskData, currentTasks) {
    if (!isDemoModeAllowed()) {
      throw new Error('Demo mode is disabled in production. Please log in with email/password.');
    }

    try {
      // Remove priority from task data - priority exists ONLY on subtasks (checklist items)
      if (taskData.priority !== undefined) {
        delete taskData.priority;
      }

      // Ensure all checklist items have priority field (migration/consistency)
      if (taskData.checklist && Array.isArray(taskData.checklist)) {
        taskData.checklist = taskData.checklist.map(item => ({
          ...item,
          priority: item.priority || 'normal',
        }));
      }

      // Only update comments if explicitly provided in taskData
      if (Object.prototype.hasOwnProperty.call(taskData, 'comments')) {
        taskData.comments = normalizeComments(taskData.comments).map(c => ({
          id: c.id || generateId(),
          text: typeof c.text === 'string' ? c.text : '',
          createdAt: c.createdAt && typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
          author: c.author && typeof c.author === 'string' ? c.author.trim() : null,
        }));
      }

      const updatedTasks = currentTasks.map(t =>
        t.id === taskId ? { ...t, ...taskData } : t
      );
      localStorage.setItem(this.storageKey, JSON.stringify(updatedTasks));
      return updatedTasks;
    } catch (error) {
      logger.error('Error updating task in localStorage:', error);
      throw error;
    }
  }

  async deleteTask(taskId, currentTasks) {
    if (!isDemoModeAllowed()) {
      throw new Error('Demo mode is disabled in production. Please log in with email/password.');
    }

    try {
      const updatedTasks = currentTasks.map(t =>
        t.id === taskId ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
      );
      localStorage.setItem(this.storageKey, JSON.stringify(updatedTasks));
      return updatedTasks;
    } catch (error) {
      logger.error('Error deleting task in localStorage:', error);
      throw error;
    }
  }

  async permanentDeleteTask(taskId) {
    if (!isDemoModeAllowed()) {
      throw new Error('Demo mode is disabled in production. Please log in with email/password.');
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        showError('No tasks found');
        return;
      }

      const currentTasks = JSON.parse(stored);
      const updatedTasks = currentTasks.filter(t => t.id !== taskId);
      localStorage.setItem(this.storageKey, JSON.stringify(updatedTasks));
      return updatedTasks;
    } catch (error) {
      logger.error('Error permanently deleting task in localStorage:', error);
      throw error;
    }
  }

  async restoreTask(taskId) {
    if (!isDemoModeAllowed()) {
      throw new Error('Demo mode is disabled in production. Please log in with email/password.');
    }

    try {
      logger.logWithPrefix('LocalStorageTaskStorage', 'Restoring task from localStorage');
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        showError('No tasks found');
        return;
      }

      const currentTasks = JSON.parse(stored);
      const taskIndex = currentTasks.findIndex(t => t.id === taskId);

      if (taskIndex === -1) {
        logger.error('Task not found:', taskId);
        showError('Task not found');
        return;
      }

      // Remove deleted flag and deletedAt
      const updatedTasks = currentTasks.map(t => {
        if (t.id === taskId) {
          const { deleted, deletedAt, ...rest } = t;
          return { ...rest, deleted: false };
        }
        return t;
      });

      localStorage.setItem(this.storageKey, JSON.stringify(updatedTasks));
      logger.logWithPrefix('LocalStorageTaskStorage', 'Task restored successfully:', taskId);
      return updatedTasks;
    } catch (error) {
      logger.error('Error restoring task in localStorage:', error);
      throw error;
    }
  }

  async restoreTaskStatus(taskId) {
    if (!isDemoModeAllowed()) {
      throw new Error('Demo mode is disabled in production. Please log in with email/password.');
    }

    try {
      logger.logWithPrefix('LocalStorageTaskStorage', 'Restoring task status from localStorage');
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        showError('No tasks found');
        return;
      }

      const currentTasks = JSON.parse(stored);
      const taskIndex = currentTasks.findIndex(t => t.id === taskId);

      if (taskIndex === -1) {
        logger.error('Task not found:', taskId);
        showError('Task not found');
        return;
      }

      // Change status from "Slutförd" back to "Pågående"
      const updatedTasks = currentTasks.map(t =>
        t.id === taskId ? { ...t, status: STATUSES.PAGENDE } : t
      );

      localStorage.setItem(this.storageKey, JSON.stringify(updatedTasks));
      logger.logWithPrefix('LocalStorageTaskStorage', 'Task status restored successfully:', taskId);
      return updatedTasks;
    } catch (error) {
      logger.error('Error restoring task status in localStorage:', error);
      throw error;
    }
  }
}

/**
 * Firestore-based task storage (for production)
 */
export class FirestoreTaskStorage extends BaseTaskStorage {
  constructor(user) {
    super(user);
  }

  setupListener(callback) {
    try {
      const tasksCollection = getTasksCollection(this.user.uid);
      logger.logWithPrefix('FirestoreTaskStorage', 'Setting up Firestore listener for collection:', tasksCollection.path);

      // Use basic query for now - filter deleted tasks client-side
      // This ensures compatibility even if Firestore composite index doesn't exist
      // To enable server-side filtering, create a Firestore composite index for:
      // Collection: tasks, Fields: deleted (ascending) + startDate (ascending)
      const q = tasksCollection;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            logger.logWithPrefix('FirestoreTaskStorage', 'Tasks snapshot received, docs count:', snapshot.docs.length);

            // Validate and normalize tasks from Firestore
            let tasksData = snapshot.docs
              .map((d) => {
                try {
                  const validated = validateTask(d.data(), d.id);
                  validated.comments = Array.isArray(validated.comments) ? validated.comments : [];
                  return validated;
                } catch (err) {
                  logger.warn(`Error validating task ${d.id}:`, err);
                  return null;
                }
              })
              .filter(Boolean)
              .filter(task => !task.deleted); // Filter deleted tasks client-side

            // Sort tasks by startDate
            tasksData.sort((a, b) => {
              const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
              const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
              return dateA - dateB;
            });

            logger.logWithPrefix('FirestoreTaskStorage', 'Tasks processed and set:', tasksData.length);
            callback(tasksData);
          } catch (error) {
            logger.error('Error processing tasks data:', error);
            // Don't throw - callback with empty array to prevent breaking the app
            callback([]);
          }
        },
        (error) => {
          logger.error('Error loading tasks from Firestore:', error);
          logger.error('Error code:', error.code);
          logger.error('Error message:', error.message);
          // Callback with empty array instead of throwing to prevent app crash
          callback([]);
        }
      );

      return () => {
        logger.logWithPrefix('FirestoreTaskStorage', 'Unsubscribing from tasks listener');
        unsubscribe();
      };
    } catch (error) {
      logger.error('Error setting up tasks listener:', error);
      // Return a no-op cleanup function and callback with empty array
      callback([]);
      return () => {};
    }
  }

  async loadTasks() {
    // Firestore uses real-time listeners, so this is mainly for initial load
    // The listener handles updates
    return [];
  }

  async addTask(taskData) {
    try {
      // Remove priority from task data - priority exists ONLY on subtasks (checklist items)
      const { priority, ...taskDataWithoutPriority } = taskData;

      // Normalize comments and ensure each has an id
      const normalizedComments = normalizeComments(taskData.comments).map(c => ({
        id: c.id || generateId(),
        text: typeof c.text === 'string' ? c.text : '',
        createdAt: c.createdAt && typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
        author: c.author && typeof c.author === 'string' ? c.author.trim() : null,
      }));

      // Ensure all checklist items have priority field (migration/consistency)
      const normalizedTaskData = {
        ...taskDataWithoutPriority,
        checklist: taskData.checklist && Array.isArray(taskData.checklist)
          ? taskData.checklist.map(item => ({
              ...item,
              priority: item.priority || 'normal',
            }))
          : taskData.checklist,
        comments: normalizedComments,
        createdAt: new Date().toISOString(),
      };

      logger.logWithPrefix('FirestoreTaskStorage', 'Adding task to Firebase:', { userId: this.user.uid, taskData: normalizedTaskData });
      const docRef = await retryWithBackoff(
        () => addDoc(getTasksCollection(this.user.uid), normalizedTaskData),
        {
          retries: 3,
          baseDelay: 1000,
          shouldRetry: shouldRetryFirebaseError,
          testMode: import.meta.env.MODE === 'test',
        }
      );
      logger.logWithPrefix('FirestoreTaskStorage', 'Task added successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error('Error adding task:', error);
      throw error;
    }
  }

  async updateTask(taskId, taskData) {
    try {
      // Remove priority from task data - priority exists ONLY on subtasks (checklist items)
      if (taskData.priority !== undefined) {
        delete taskData.priority;
      }

      // Ensure all checklist items have priority field (migration/consistency)
      if (taskData.checklist && Array.isArray(taskData.checklist)) {
        taskData.checklist = taskData.checklist.map(item => ({
          ...item,
          priority: item.priority || 'normal',
        }));
      }

      // Only update comments if explicitly provided in taskData
      if (Object.prototype.hasOwnProperty.call(taskData, 'comments')) {
        taskData.comments = normalizeComments(taskData.comments).map(c => ({
          id: c.id || generateId(),
          text: typeof c.text === 'string' ? c.text : '',
          createdAt: c.createdAt && typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
          author: c.author && typeof c.author === 'string' ? c.author.trim() : null,
        }));
      }

      await retryWithBackoff(
        () => updateDoc(getTaskDoc(this.user.uid, taskId), taskData),
        {
          retries: 3,
          baseDelay: 1000,
          shouldRetry: shouldRetryFirebaseError,
          testMode: import.meta.env.MODE === 'test',
        }
      );
    } catch (error) {
      logger.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      await retryWithBackoff(
        () => updateDoc(getTaskDoc(this.user.uid, taskId), {
          deleted: true,
          deletedAt: new Date().toISOString(),
        }),
        {
          retries: 3,
          baseDelay: 1000,
          shouldRetry: shouldRetryFirebaseError,
          testMode: import.meta.env.MODE === 'test',
        }
      );
    } catch (error) {
      logger.error('Error deleting task:', error);
      throw error;
    }
  }

  async permanentDeleteTask(taskId) {
    try {
      await retryWithBackoff(
        () => deleteDoc(getTaskDoc(this.user.uid, taskId)),
        {
          retries: 3,
          baseDelay: 1000,
          shouldRetry: shouldRetryFirebaseError,
          testMode: import.meta.env.MODE === 'test',
        }
      );
    } catch (error) {
      logger.error('Error permanently deleting task:', error);
      throw error;
    }
  }

  async restoreTask(taskId) {
    try {
      logger.logWithPrefix('FirestoreTaskStorage', 'Restoring task in Firebase:', taskId);
      await retryWithBackoff(
        () => updateDoc(getTaskDoc(this.user.uid, taskId), {
          deleted: false,
          deletedAt: null,
        }),
        {
          retries: 3,
          baseDelay: 1000,
          shouldRetry: shouldRetryFirebaseError,
          testMode: import.meta.env.MODE === 'test',
        }
      );
      logger.logWithPrefix('FirestoreTaskStorage', 'Task restored successfully in Firebase:', taskId);
    } catch (error) {
      logger.error('Error restoring task:', error);
      throw error;
    }
  }

  async restoreTaskStatus(taskId) {
    try {
      logger.logWithPrefix('FirestoreTaskStorage', 'Restoring task status in Firebase:', taskId);
      await retryWithBackoff(
        () => updateDoc(getTaskDoc(this.user.uid, taskId), {
          status: STATUSES.PAGENDE,
        }),
        {
          retries: 3,
          baseDelay: 1000,
          shouldRetry: shouldRetryFirebaseError,
          testMode: import.meta.env.MODE === 'test',
        }
      );
      logger.logWithPrefix('FirestoreTaskStorage', 'Task status restored successfully in Firebase:', taskId);
    } catch (error) {
      logger.error('Error restoring task status:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create the appropriate task storage instance
 * Automatically selects localStorage (demo mode) or Firestore (production) based on user
 * 
 * @param {Object} user - The current user (Firebase User object)
 * @returns {BaseTaskStorage} - The appropriate storage instance
 *   - LocalStorageTaskStorage if user.uid starts with 'demo-user-'
 *   - FirestoreTaskStorage otherwise
 * @throws {Error} If demo mode is attempted in production
 * 
 * @example
 * const user = { uid: 'demo-user-123' };
 * const storage = createTaskStorage(user); // Returns LocalStorageTaskStorage
 * 
 * const user = { uid: 'firebase-user-456' };
 * const storage = createTaskStorage(user); // Returns FirestoreTaskStorage
 */
export const createTaskStorage = (user) => {
  if (user?.uid?.startsWith('demo-user-')) {
    return new LocalStorageTaskStorage(user);
  }
  return new FirestoreTaskStorage(user);
};
