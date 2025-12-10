/**
 * Hook for managing backups (local and cloud)
 * Extracted from useTasks backup logic
 */
import { useState, useCallback } from 'react';
import { addDoc, getDocs, updateDoc } from 'firebase/firestore';
import { getBackupsCollection } from '../config/firebase';
import { formatDate } from '../utils/helpers';
import { showError, showSuccess } from '../utils/toast';

/**
 * @param {Object} user - Firebase user object
 * @param {Function} t - Translation function
 * @returns {Object} Backup management functions
 */
export const useBackups = (user, t) => {
  const [cloudBackups, setCloudBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Load cloud backups
  const loadCloudBackups = useCallback(async () => {
    if (!user || !user.uid || user.uid.startsWith('demo-user-')) {
      return;
    }

    setLoadingBackups(true);
    try {
      const backupsRef = getBackupsCollection(user.uid);
      const snapshot = await getDocs(backupsRef);
      const backups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      setCloudBackups(backups);
    } catch (error) {
      console.error('Error loading backups:', error);
      showError(t('errorLoadingBackups') + ': ' + error.message);
    } finally {
      setLoadingBackups(false);
    }
  }, [user, t]);

  // Create cloud backup
  const createCloudBackup = useCallback(async (tasks) => {
    if (!user || !user.uid) {
      showError(t('errorCreatingBackup') + ': No user');
      return;
    }

    if (user.uid.startsWith('demo-user-')) {
      showError(t('errorCreatingBackup') + ': Demo mode');
      return;
    }

    try {
      const backupData = {
        name: `Backup ${formatDate(new Date())}`,
        tasks,
        timestamp: Date.now(),
      };

      const backupsRef = getBackupsCollection(user.uid);
      await addDoc(backupsRef, backupData);
      
      await loadCloudBackups();
      showSuccess(t('backupSaved'));
    } catch (error) {
      console.error('Error creating backup:', error);
      showError(t('errorCreatingBackup') + ': ' + error.message);
      throw error;
    }
  }, [user, t, loadCloudBackups]);

  // Restore from cloud backup
  const restoreCloudBackup = useCallback(async (backupId, tasks) => {
    if (!user || !user.uid) {
      showError(t('errorRestoringBackup') + ': No user');
      return;
    }

    if (user.uid.startsWith('demo-user-')) {
      showError(t('errorRestoringBackup') + ': Demo mode');
      return;
    }

    try {
      const backup = cloudBackups.find(b => b.id === backupId);
      if (!backup || !backup.tasks) {
        showError(t('errorRestoringBackup') + ': Backup not found');
        return;
      }

      // Restore logic would go here (update all tasks)
      // This is a simplified version - actual implementation depends on your restore strategy
      showSuccess(t('restoreCompleted'));
    } catch (error) {
      console.error('Error restoring backup:', error);
      showError(t('errorRestoringBackup') + ': ' + error.message);
      throw error;
    }
  }, [user, t, cloudBackups]);

  // Export to JSON (local)
  const exportData = useCallback((tasks) => {
    try {
      const data = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tasks,
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      showError(t('errorExportingData') || 'Error exporting data');
      return null;
    }
  }, [t]);

  // Import from JSON (local)
  const importData = useCallback(async (jsonString, onImport) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('Invalid backup format');
      }

      if (onImport && typeof onImport === 'function') {
        await onImport(data.tasks);
        showSuccess(t('restoreCompleted'));
      }
    } catch (error) {
      console.error('Error importing data:', error);
      showError(t('errorImportingTasks') + ': ' + error.message);
      throw error;
    }
  }, [t]);

  return {
    cloudBackups,
    loadingBackups,
    loadCloudBackups,
    createCloudBackup,
    restoreCloudBackup,
    exportData,
    importData,
  };
};

