import { useState, useEffect, useRef, useMemo } from 'react';
import { getDocs, addDoc, setDoc } from 'firebase/firestore';
import { getTasksCollection, getBackupsCollection, appId, getTaskDoc } from '../config/firebase';
import { generateId } from '../utils/helpers';
import { showError, showSuccess } from '../utils/toast';
import { logger } from '../utils/logger';
import { createTaskStorage } from '../utils/taskStorage';
import { validateTasks } from '../utils/validation';

export const useTasks = (user) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cloudBackups, setCloudBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const viewInitializedRef = useRef(false);
  
  // Create task storage instance (memoized to avoid recreating on every render)
  const taskStorage = useMemo(() => {
    if (!user) return null;
    return createTaskStorage(user);
  }, [user]);
  
  // Retry function for failed operations
  const retry = async () => {
    setError(null);
    setLoading(true);
    // The useEffect will automatically retry when loading changes
  };

  // Load tasks using TaskStorage abstraction
  useEffect(() => {
    if (!user || !taskStorage) {
      // If no user, set loading to false and tasks to empty array
      logger.logWithPrefix('useTasks', 'No user, setting tasks to empty array');
      setLoading(false);
      setTasks([]);
      return;
    }

    logger.logWithPrefix('useTasks', 'Setting up tasks listener for user:', user.uid);
    setLoading(true); // Reset loading state when user changes

    // Use TaskStorage to load initial tasks and set up listener
    try {
      // Load initial tasks
      taskStorage.loadTasks()
        .then(initialTasks => {
          setTasks(initialTasks);
          setError(null);
          setLoading(false);
        })
        .catch(err => {
          logger.error('Error loading initial tasks:', err);
          setError(err);
          setTasks([]);
          setLoading(false);
        });

      // Set up listener for real-time updates
      const unsubscribe = taskStorage.setupListener((updatedTasks) => {
        setTasks(updatedTasks);
        setError(null);
        setLoading(false);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      logger.error('Error setting up tasks listener:', error);
      setError(error);
      setLoading(false);
      setTasks([]);
    }

    // Check for localStorage migration on first Firebase login (async)
    // This is only needed for Firebase users, not demo users
    if (!user.uid.startsWith('demo-user-')) {
      const migrationKey = `migrated-to-firebase-${user.uid}`;
      if (!localStorage.getItem(migrationKey)) {
        // Run migration check asynchronously
        (async () => {
          try {
            // Check if Firestore is empty before attempting migration
            const q = getTasksCollection(user.uid);
            const initialSnapshot = await getDocs(q);
            if (initialSnapshot.docs.length === 0) {
              // Firestore is empty, check for localStorage data
              const stored = localStorage.getItem('demo-tasks');
              if (stored) {
                const tasksData = JSON.parse(stored);
                if (tasksData && tasksData.length > 0) {
                  logger.logWithPrefix('Migration', 'Found localStorage data to migrate:', tasksData.length, 'tasks');
                  const validatedTasks = validateTasks(tasksData);
                  const migrationPromises = validatedTasks.map(async (task) => {
                    try {
                      const taskRef = getTaskDoc(user.uid, task.id);
                      await setDoc(taskRef, task);
                      return true;
                    } catch (error) {
                      logger.error(`[Migration] Error migrating task ${task.id}:`, error);
                      return false;
                    }
                  });
                  const results = await Promise.all(migrationPromises);
                  const successCount = results.filter(Boolean).length;
                  if (successCount > 0) {
                    logger.logWithPrefix('Migration', `Successfully migrated ${successCount}/${validatedTasks.length} tasks to Firestore`);
                    localStorage.setItem(migrationKey, 'true');
                    showSuccess(`Migrated ${successCount} tasks from local storage to cloud`);
                  }
                }
              }
            } else {
              // Firestore has data, mark as migrated
              localStorage.setItem(migrationKey, 'true');
            }
          } catch (error) {
            logger.error('[Migration] Error checking for migration:', error);
          }
        })();
      }
    }
  }, [user, taskStorage]);

  // Add task using TaskStorage
  const addTask = async (taskData) => {
    logger.logWithPrefix('addTask', 'called with:', { user: user?.uid, taskData });
    
    if (!user || !taskStorage) {
      const errorMsg = 'You must be logged in to add tasks';
      logger.error('Cannot add task: No user or taskStorage');
      showError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const taskId = await taskStorage.addTask(taskData);
      
      // For localStorage mode, update state directly
      if (user.uid && user.uid.startsWith('demo-user-')) {
        const updatedTasks = await taskStorage.loadTasks();
        setTasks(updatedTasks);
        // Force a re-render by triggering a state update
        setTimeout(() => {
          const verify = localStorage.getItem('demo-tasks');
          if (verify) {
            const verified = JSON.parse(verify);
            if (verified.length !== updatedTasks.length) {
              logger.warn('State mismatch detected, syncing...');
              setTasks(verified);
            }
          }
        }, 100);
      }
      
      showSuccess('Ny uppgift created');
      return taskId;
    } catch (error) {
      logger.error('Error adding task:', error);
      const errorMsg = error.message || 'Error creating task';
      showError('Error creating task: ' + errorMsg);
      throw error;
    }
  };

  // Update task using TaskStorage
  const updateTask = async (taskId, taskData) => {
    if (!user || !taskStorage) {
      showError('You must be logged in to update tasks');
      throw new Error('No user or taskStorage');
    }

    try {
      // For localStorage mode, we need current tasks to update
      if (user.uid && user.uid.startsWith('demo-user-')) {
        const currentTasks = tasks || [];
        const updatedTasks = await taskStorage.updateTask(taskId, taskData, currentTasks);
        setTasks(updatedTasks);
      } else {
        // Firebase mode - TaskStorage handles it
        await taskStorage.updateTask(taskId, taskData);
      }
    } catch (error) {
      logger.error('Error updating task:', error);
      showError('Error updating task');
      throw error;
    }
  };

  // Delete task (soft delete) using TaskStorage
  const deleteTask = async (taskId) => {
    if (!user || !taskStorage) {
      showError('You must be logged in to delete tasks');
      throw new Error('No user or taskStorage');
    }

    try {
      // For localStorage mode, we need current tasks to update
      if (user.uid && user.uid.startsWith('demo-user-')) {
        const currentTasks = tasks || [];
        const updatedTasks = await taskStorage.deleteTask(taskId, currentTasks);
        setTasks(updatedTasks);
      } else {
        // Firebase mode - TaskStorage handles it
        await taskStorage.deleteTask(taskId);
      }
      showSuccess('Task moved to trash');
    } catch (error) {
      logger.error('Error deleting task:', error);
      showError('Error deleting task');
      throw error;
    }
  };

  // Permanently delete task using TaskStorage
  const permanentDeleteTask = async (taskId) => {
    if (!user || !taskStorage) {
      showError('You must be logged in to delete tasks');
      return;
    }

    try {
      // For localStorage mode, update state
      if (user.uid && user.uid.startsWith('demo-user-')) {
        const updatedTasks = await taskStorage.permanentDeleteTask(taskId);
        if (updatedTasks) {
          setTasks(updatedTasks);
        }
      } else {
        // Firebase mode - TaskStorage handles it
        await taskStorage.permanentDeleteTask(taskId);
      }
      showSuccess('Uppgift raderad permanent');
    } catch (error) {
      logger.error('Error permanently deleting task:', error);
      showError('Error deleting task');
      throw error;
    }
  };

  // Restore task from trash using TaskStorage
  const restoreTask = async (taskId) => {
    if (!user || !taskStorage) {
      showError('You must be logged in to restore tasks');
      return;
    }

    logger.logWithPrefix('restoreTask', 'called for taskId:', taskId);

    try {
      // For localStorage mode, update state
      if (user.uid && user.uid.startsWith('demo-user-')) {
        const updatedTasks = await taskStorage.restoreTask(taskId);
        if (updatedTasks) {
          setTasks(updatedTasks);
        }
      } else {
        // Firebase mode - TaskStorage handles it
        await taskStorage.restoreTask(taskId);
      }
      showSuccess('Uppgift återställd');
    } catch (error) {
      logger.error('Error restoring task:', error);
      showError('Error restoring task: ' + error.message);
      throw error;
    }
  };

  // Restore task status (from archive) using TaskStorage
  const restoreTaskStatus = async (taskId) => {
    if (!user || !taskStorage) {
      showError('You must be logged in to restore tasks');
      return;
    }

    logger.logWithPrefix('restoreTaskStatus', 'called for taskId:', taskId);

    try {
      // For localStorage mode, update state
      if (user.uid && user.uid.startsWith('demo-user-')) {
        const updatedTasks = await taskStorage.restoreTaskStatus(taskId);
        if (updatedTasks) {
          setTasks(updatedTasks);
        }
      } else {
        // Firebase mode - TaskStorage handles it
        await taskStorage.restoreTaskStatus(taskId);
      }
      showSuccess('Uppgift återställd');
    } catch (error) {
      logger.error('Error restoring task status:', error);
      showError('Error restoring task: ' + error.message);
      throw error;
    }
  };

  // Fetch cloud backups
  const fetchCloudBackups = async () => {
    if (!user) return;
    setLoadingBackups(true);
    try {
      const q = getBackupsCollection(user.uid);
      const snapshot = await getDocs(q);
      let backups = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      backups.sort((a, b) => {
        const tA = new Date(a.timestamp || 0);
        const tB = new Date(b.timestamp || 0);
        return tB - tA;
      });

      setCloudBackups(backups.slice(0, 5));
    } catch (err) {
      logger.error('Error fetching backups:', err);
      showError('Error loading backups');
    }
    setLoadingBackups(false);
  };

  // Create cloud backup
  const createCloudBackup = async () => {
    if (!user) return;
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        taskCount: tasks.length,
        tasks: JSON.stringify(tasks),
      };
      await addDoc(getBackupsCollection(user.uid), backupData);
      showSuccess('Backup saved to cloud!');
      fetchCloudBackups();
    } catch (err) {
      logger.error('Error creating cloud backup:', err);
      showError('Error creating backup');
    }
  };

  // Restore from cloud backup
  const restoreCloudBackup = async (backup) => {
    if (!user || !backup.tasks) return;
    if (!window.confirm('Vill du importera uppgifter? Befintliga uppgifter uppdateras.')) return;
    
    try {
      const restoredTasks = JSON.parse(backup.tasks);
      await processRestore(restoredTasks);
      showSuccess('Restore completed!');
    } catch (err) {
      logger.error('Error restoring cloud backup:', err);
      showError('Error restoring backup');
    }
  };

  // Process restore (import tasks)
  const processRestore = async (importedTasks) => {
    if (!Array.isArray(importedTasks)) {
      throw new Error('Invalid data format');
    }
    if (!user) return;

    try {
      for (const task of importedTasks) {
        const { id, ...taskData } = task;
        // Ensure IDs in restored data
        if (taskData.checklist) {
          taskData.checklist = taskData.checklist.map((i) => ({
            ...i,
            id: i.id || generateId(),
          }));
        }

        if (id) {
          await setDoc(getTaskDoc(user.uid, id), taskData, { merge: true });
        } else {
          await addDoc(getTasksCollection(user.uid), taskData);
        }
      }
      showSuccess('Import completed!');
    } catch (error) {
      logger.error('Error processing restore:', error);
      showError('Error importing tasks');
      throw error;
    }
  };

  // Export data
  const exportData = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gantt_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Data exported successfully');
  };

  // Import data
  const importData = async (file) => {
    if (!file || !user) return;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedTasks = JSON.parse(e.target.result);
          await processRestore(importedTasks);
          resolve();
        } catch (error) {
          logger.error('Import error:', error);
          showError('Import error: ' + error.message);
          reject(error);
        }
      };
      reader.onerror = () => {
        showError('Error reading file');
        reject(new Error('File read error'));
      };
      reader.readAsText(file);
    });
  };

  // Computed values for archived and deleted tasks
  const archivedTasks = tasks.filter(t => !t.deleted && (t.status === 'Klar' || t.status === 'Done'));
  const deletedTasks = tasks.filter(t => t.deleted);

  return {
    tasks,
    archivedTasks,
    deletedTasks,
    loading,
    error,
    retry,
    cloudBackups,
    loadingBackups,
    addTask,
    updateTask,
    deleteTask,
    permanentDeleteTask,
    restoreTask,
    restoreTaskStatus,
    fetchCloudBackups,
    createCloudBackup,
    restoreCloudBackup,
    exportData,
    importData,
    viewInitializedRef,
  };
};


