import { useState, useEffect, useRef } from 'react';
import { onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { getTasksCollection, getTaskDoc, getBackupsCollection, appId, isDemoModeAllowed } from '../config/firebase';
import { generateId, formatDate } from '../utils/helpers';
import { showError, showSuccess } from '../utils/toast';
import { validateTasks, validateTask } from '../utils/validation';

// Helper function to normalize comments to always be an array
const normalizeComments = (comments) => Array.isArray(comments) ? comments : [];

export const useTasks = (user) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cloudBackups, setCloudBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const viewInitializedRef = useRef(false);
  
  // Retry function for failed operations
  const retry = async () => {
    setError(null);
    setLoading(true);
    // The useEffect will automatically retry when loading changes
  };

  // Load tasks
  useEffect(() => {
    if (!user) {
      // If no user, set loading to false and tasks to empty array
      console.log('No user, setting tasks to empty array');
      setLoading(false);
      setTasks([]);
      return;
    }

    console.log('Setting up tasks listener for user:', user.uid);
    setLoading(true); // Reset loading state when user changes

    // For demo mode (mock users), use localStorage instead of Firestore
    // BUT ONLY on localhost - production requires real Firebase auth
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) {
        console.error('[PRODUCTION] Demo mode is not allowed in production. Please log in with email/password.');
        setError(new Error('Demo mode is disabled in production. Please log in with email/password.'));
        setLoading(false);
        setTasks([]);
        return;
      }
      console.log('[LOCAL DEMO MODE] Using localStorage for tasks (localhost only)');
      try {
        const stored = localStorage.getItem('demo-tasks');
        if (stored) {
          const tasksData = JSON.parse(stored);
          // Validate and normalize tasks
          const validatedTasks = validateTasks(tasksData);
          console.log('Loaded tasks from localStorage:', validatedTasks.length);
          console.log('Task titles:', validatedTasks.map(t => t.title));
          setTasks(validatedTasks);
          setError(null);
        } else {
          console.log('No tasks found in localStorage');
          setTasks([]);
          setError(null);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        setError(error);
        setTasks([]);
        setLoading(false);
      }
      
      // Set up a listener for localStorage changes (for multi-tab support)
      const handleStorageChange = (e) => {
        if (e.key === 'demo-tasks') {
          console.log('localStorage changed, reloading tasks');
          const stored = localStorage.getItem('demo-tasks');
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
              setTasks(tasksWithIds);
            } catch (err) {
              console.error('Error parsing updated tasks:', err);
            }
          }
        }
      };
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }

    // Check for localStorage data to migrate when switching to Firebase
    const checkAndMigrateLocalStorageData = async (firebaseUser) => {
      try {
        const stored = localStorage.getItem('demo-tasks');
        if (!stored) return false;

        const tasksData = JSON.parse(stored);
        if (!tasksData || tasksData.length === 0) return false;

        // Check if migration has already been done for this Firebase user
        const migrationKey = `migrated-to-firebase-${firebaseUser.uid}`;
        if (localStorage.getItem(migrationKey)) {
          console.log('[Migration] Already migrated for this Firebase user');
          return false;
        }

        // Check if Firestore already has tasks (don't migrate if user already has data)
        const q = getTasksCollection(firebaseUser.uid);
        const snapshot = await getDocs(q);
        if (snapshot.docs.length > 0) {
          console.log('[Migration] Firestore already has tasks, skipping migration');
          // Mark as migrated anyway to avoid prompting
          localStorage.setItem(migrationKey, 'true');
          return false;
        }

        console.log('[Migration] Found localStorage data to migrate:', tasksData.length, 'tasks');
        
        // Migrate tasks to Firestore
        const validatedTasks = validateTasks(tasksData);
        const migrationPromises = validatedTasks.map(async (task) => {
          try {
            const taskRef = getTaskDoc(firebaseUser.uid, task.id);
            await setDoc(taskRef, task);
            return true;
          } catch (error) {
            console.error(`[Migration] Error migrating task ${task.id}:`, error);
            return false;
          }
        });

        const results = await Promise.all(migrationPromises);
        const successCount = results.filter(Boolean).length;
        
        if (successCount > 0) {
          console.log(`[Migration] Successfully migrated ${successCount}/${validatedTasks.length} tasks to Firestore`);
          // Mark as migrated
          localStorage.setItem(migrationKey, 'true');
          // Optionally clear localStorage data after successful migration
          // localStorage.removeItem('demo-tasks');
          showSuccess(`Migrated ${successCount} tasks from local storage to cloud`);
          return true;
        }
      } catch (error) {
        console.error('[Migration] Error during migration:', error);
      }
      return false;
    };

    try {
      const q = getTasksCollection(user.uid);
      const tasksPath = `artifacts/${appId}/users/${user.uid}/tasks`;
      console.log('Tasks listener path:', tasksPath);
      console.log('Setting up Firestore listener for collection:', q.path);
      
      // Check for localStorage migration on first Firebase login (async)
      const migrationKey = `migrated-to-firebase-${user.uid}`;
      if (!localStorage.getItem(migrationKey)) {
        // Run migration check asynchronously
        (async () => {
          try {
            // Check if Firestore is empty before attempting migration
            const initialSnapshot = await getDocs(q);
            if (initialSnapshot.docs.length === 0) {
              // Firestore is empty, check for localStorage data
              await checkAndMigrateLocalStorageData(user);
            } else {
              // Firestore has data, mark as migrated
              localStorage.setItem(migrationKey, 'true');
            }
          } catch (error) {
            console.error('[Migration] Error checking for migration:', error);
          }
        })();
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            console.log('Tasks snapshot received, docs count:', snapshot.docs.length);
            if (snapshot.docs.length > 0) {
              console.log('First task sample:', snapshot.docs[0].data());
            }
            
            // Validate and normalize tasks from Firestore
            const tasksData = snapshot.docs
              .map((d) => {
                try {
                  const validated = validateTask(d.data(), d.id);
                  // Ensure comments is always an array after validation
                  validated.comments = Array.isArray(validated.comments) ? validated.comments : [];
                  return validated;
                } catch (err) {
                  console.warn(`Error validating task ${d.id}:`, err);
                  return null;
                }
              })
              .filter(Boolean);

            tasksData.sort((a, b) => {
              const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
              const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
              return dateA - dateB;
            });
            
            console.log('Tasks processed and set:', tasksData.length);
            console.log('Task IDs:', tasksData.map(t => t.id));
            console.log('Task titles:', tasksData.map(t => t.title));
            
            setTasks(tasksData);
            setError(null);
            setLoading(false);
          } catch (error) {
            console.error('Error processing tasks data:', error);
            const errorMsg = 'Error processing tasks: ' + error.message;
            setError(error);
            showError(errorMsg);
            setLoading(false);
            setTasks([]);
          }
        },
        (error) => {
          console.error('Error loading tasks from Firestore:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          const errorMsg = 'Error loading tasks: ' + error.message;
          setError(error);
          showError(errorMsg);
          setLoading(false);
          setTasks([]);
        }
      );

      return () => {
        console.log('Unsubscribing from tasks listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up tasks listener:', error);
      setError(error);
      showError('Error setting up tasks listener: ' + error.message);
      setLoading(false);
      setTasks([]);
    }
  }, [user]);

  // Add task
  const addTask = async (taskData) => {
    console.log('addTask called with:', { user: user?.uid, taskData });
    
    if (!user) {
      const errorMsg = 'You must be logged in to add tasks';
      console.error('Cannot add task: No user');
      showError(errorMsg);
      throw new Error(errorMsg);
    }

    // For demo mode, use localStorage (only on localhost)
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) {
        throw new Error('Demo mode is disabled in production. Please log in with email/password.');
      }
      try {
        console.log('[LOCAL DEMO MODE] Adding task to localStorage:', taskData);
        
        // Always read from localStorage to avoid stale state
        const stored = localStorage.getItem('demo-tasks');
        let currentTasks = [];
        if (stored) {
          try {
            currentTasks = JSON.parse(stored);
            console.log('Loaded existing tasks from localStorage:', currentTasks.length);
          } catch (e) {
            console.error('Error parsing stored tasks:', e);
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
          // NOTE: Priority exists ONLY on subtasks, never on main tasks
          createdAt: new Date().toISOString(),
        };
        
        const updatedTasks = [...currentTasks, newTask];
        console.log('Saving to localStorage, total tasks:', updatedTasks.length);
        localStorage.setItem('demo-tasks', JSON.stringify(updatedTasks));
        
        // Update state directly
        setTasks(updatedTasks);
        
        // Force a re-render by triggering a state update
        // This ensures the UI updates immediately
        setTimeout(() => {
          const verify = localStorage.getItem('demo-tasks');
          if (verify) {
            const verified = JSON.parse(verify);
            if (verified.length !== updatedTasks.length) {
              console.warn('State mismatch detected, syncing...');
              setTasks(verified);
            }
          }
        }, 100);
        
        console.log('Task added to localStorage with ID:', newTask.id);
        console.log('Task title:', newTask.title);
        console.log('Total tasks now:', updatedTasks.length);
        
        showSuccess('Ny uppgift created');
        return newTask.id;
      } catch (error) {
        console.error('Error adding task to localStorage:', error);
        showError('Error creating task: ' + error.message);
        throw error;
      }
    }

    // Real Firebase mode
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
              priority: item.priority || 'normal', // Ensure priority is always present on subtasks
            }))
          : taskData.checklist,
        comments: normalizedComments,
        createdAt: new Date().toISOString(),
      };
      
      console.log('Adding task to Firebase:', { userId: user.uid, taskData: normalizedTaskData });
      const docRef = await addDoc(getTasksCollection(user.uid), normalizedTaskData);
      console.log('Task added successfully with ID:', docRef.id);
      // Note: onSnapshot will automatically update the tasks list
      showSuccess('Ny uppgift created');
      return docRef.id;
    } catch (error) {
      console.error('Error adding task:', error);
      const errorMsg = error.message || 'Error creating task';
      showError('Error creating task: ' + errorMsg);
      throw error;
    }
  };

  // Update task
  const updateTask = async (taskId, taskData) => {
    if (!user) {
      showError('You must be logged in to update tasks');
      throw new Error('No user');
    }

    // Remove priority from task data - priority exists ONLY on subtasks (checklist items)
    if (taskData.priority !== undefined) {
      delete taskData.priority;
    }
    
    // Ensure all checklist items have priority field (migration/consistency)
    if (taskData.checklist && Array.isArray(taskData.checklist)) {
      taskData.checklist = taskData.checklist.map(item => ({
        ...item,
        priority: item.priority || 'normal', // Ensure priority is always present on subtasks
      }));
    }
    
    // Only update comments if explicitly provided in taskData
    if (Object.prototype.hasOwnProperty.call(taskData, 'comments')) {
      // Normalize comments and ensure each has an id
      taskData.comments = normalizeComments(taskData.comments).map(c => ({
        id: c.id || generateId(),
        text: typeof c.text === 'string' ? c.text : '',
        createdAt: c.createdAt && typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
        author: c.author && typeof c.author === 'string' ? c.author.trim() : null,
      }));
    }

    // For demo mode, use localStorage (only on localhost)
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) {
        throw new Error('Demo mode is disabled in production. Please log in with email/password.');
      }
      try {
        const currentTasks = tasks || [];
        const updatedTasks = currentTasks.map(t => 
          t.id === taskId ? { ...t, ...taskData } : t
        );
        localStorage.setItem('demo-tasks', JSON.stringify(updatedTasks));
        setTasks(updatedTasks);
        return;
      } catch (error) {
        console.error('Error updating task in localStorage:', error);
        showError('Error updating task');
        throw error;
      }
    }

    try {
      await updateDoc(getTaskDoc(user.uid, taskId), taskData);
    } catch (error) {
      console.error('Error updating task:', error);
      showError('Error updating task');
      throw error;
    }
  };

  // Delete task (soft delete)
  const deleteTask = async (taskId) => {
    if (!user) {
      showError('You must be logged in to delete tasks');
      throw new Error('No user');
    }

    // For demo mode, use localStorage (only on localhost)
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) {
        throw new Error('Demo mode is disabled in production. Please log in with email/password.');
      }
      try {
        const currentTasks = tasks || [];
        const updatedTasks = currentTasks.map(t => 
          t.id === taskId ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
        );
        localStorage.setItem('demo-tasks', JSON.stringify(updatedTasks));
        setTasks(updatedTasks);
        showSuccess('Task moved to trash');
        return;
      } catch (error) {
        console.error('Error deleting task in localStorage:', error);
        showError('Error deleting task');
        throw error;
      }
    }

    try {
      await updateDoc(getTaskDoc(user.uid, taskId), {
        deleted: true,
        deletedAt: new Date().toISOString(),
      });
      showSuccess('Task moved to trash');
    } catch (error) {
      console.error('Error deleting task:', error);
      showError('Error deleting task');
      throw error;
    }
  };

  // Permanently delete task
  const permanentDeleteTask = async (taskId) => {
    if (!user) {
      showError('You must be logged in to delete tasks');
      return;
    }

    // For demo mode, use localStorage (only on localhost)
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) {
        throw new Error('Demo mode is disabled in production. Please log in with email/password.');
      }
      try {
        const stored = localStorage.getItem('demo-tasks');
        if (!stored) {
          showError('No tasks found');
          return;
        }

        const currentTasks = JSON.parse(stored);
        const updatedTasks = currentTasks.filter(t => t.id !== taskId);

        localStorage.setItem('demo-tasks', JSON.stringify(updatedTasks));
        setTasks(updatedTasks);
        showSuccess('Uppgift raderad permanent');
        return;
      } catch (error) {
        console.error('Error permanently deleting task in localStorage:', error);
        showError('Error deleting task');
        throw error;
      }
    }

    // Real Firebase mode
    try {
      await deleteDoc(getTaskDoc(user.uid, taskId));
      showSuccess('Uppgift raderad permanent');
    } catch (error) {
      console.error('Error permanently deleting task:', error);
      showError('Error deleting task');
      throw error;
    }
  };

  // Restore task from trash
  const restoreTask = async (taskId) => {
    if (!user) {
      showError('You must be logged in to restore tasks');
      return;
    }

    console.log('restoreTask called for taskId:', taskId);

    // For demo mode, use localStorage (only on localhost)
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) {
        throw new Error('Demo mode is disabled in production. Please log in with email/password.');
      }
      try {
        console.log('[LOCAL DEMO MODE] Restoring task from localStorage');
        const stored = localStorage.getItem('demo-tasks');
        if (!stored) {
          showError('No tasks found');
          return;
        }

        const currentTasks = JSON.parse(stored);
        const taskIndex = currentTasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          console.error('Task not found:', taskId);
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

        localStorage.setItem('demo-tasks', JSON.stringify(updatedTasks));
        setTasks(updatedTasks);
        showSuccess('Uppgift återställd');
        console.log('Task restored successfully:', taskId);
        return;
      } catch (error) {
        console.error('Error restoring task in localStorage:', error);
        showError('Error restoring task: ' + error.message);
        throw error;
      }
    }

    // Real Firebase mode
    try {
      console.log('Restoring task in Firebase:', taskId);
      await updateDoc(getTaskDoc(user.uid, taskId), {
        deleted: false,
        deletedAt: null,
      });
      showSuccess('Uppgift återställd');
      console.log('Task restored successfully in Firebase:', taskId);
    } catch (error) {
      console.error('Error restoring task:', error);
      showError('Error restoring task: ' + error.message);
      throw error;
    }
  };

  // Restore task status (from archive)
  const restoreTaskStatus = async (taskId) => {
    if (!user) {
      showError('You must be logged in to restore tasks');
      return;
    }

    console.log('restoreTaskStatus called for taskId:', taskId);

    // For demo mode, use localStorage (only on localhost)
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) {
        throw new Error('Demo mode is disabled in production. Please log in with email/password.');
      }
      try {
        console.log('[LOCAL DEMO MODE] Restoring task status from localStorage');
        const stored = localStorage.getItem('demo-tasks');
        if (!stored) {
          showError('No tasks found');
          return;
        }

        const currentTasks = JSON.parse(stored);
        const taskIndex = currentTasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          console.error('Task not found:', taskId);
          showError('Task not found');
          return;
        }

        // Change status from "Slutförd" back to "Pågående"
        const updatedTasks = currentTasks.map(t => 
          t.id === taskId 
            ? { ...t, status: 'Pågående' }
            : t
        );

        localStorage.setItem('demo-tasks', JSON.stringify(updatedTasks));
        setTasks(updatedTasks);
        showSuccess('Uppgift återställd');
        console.log('Task status restored successfully:', taskId);
        return;
      } catch (error) {
        console.error('Error restoring task status in localStorage:', error);
        showError('Error restoring task: ' + error.message);
        throw error;
      }
    }

    // Real Firebase mode
    try {
      console.log('Restoring task status in Firebase:', taskId);
      await updateDoc(getTaskDoc(user.uid, taskId), {
        status: 'Pågående',
      });
      showSuccess('Uppgift återställd');
      console.log('Task status restored successfully in Firebase:', taskId);
    } catch (error) {
      console.error('Error restoring task status:', error);
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
      console.error('Error fetching backups:', err);
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
      console.error('Error creating cloud backup:', err);
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
      console.error('Error restoring cloud backup:', err);
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
      console.error('Error processing restore:', error);
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
          console.error(error);
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


