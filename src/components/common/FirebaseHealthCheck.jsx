/**
 * Firebase Health Check Component
 * 
 * This component performs a simple diagnostic test to verify Firebase connection.
 * It should be placed in the app to run automatically and log results to console.
 */
import { useEffect, useState } from 'react';
import { getDocs, collection, query, limit } from 'firebase/firestore';
import { app, db } from '../../config/firebase';

export const FirebaseHealthCheck = ({ enabled = true, onStatusChange }) => {
  const [status, setStatus] = useState({
    initialized: false,
    connected: false,
    error: null,
    testCollection: null,
    timestamp: null
  });

  useEffect(() => {
    if (!enabled) return;

    const runHealthCheck = async () => {
      console.log('[Firebase Health Check] Starting diagnostic...');
      
      // Check 1: Verify app is initialized
      if (!app) {
        const error = 'Firebase app is not initialized';
        console.error('[Firebase Health Check] ❌', error);
        setStatus({
          initialized: false,
          connected: false,
          error,
          testCollection: null,
          timestamp: new Date().toISOString()
        });
        if (onStatusChange) onStatusChange(false, error);
        return;
      }

      console.log('[Firebase Health Check] ✅ App initialized:', {
        name: app.name,
        options: {
          projectId: app.options?.projectId,
          authDomain: app.options?.authDomain
        }
      });

      // Check 2: Verify Firestore is initialized
      if (!db) {
        const error = 'Firestore is not initialized';
        console.error('[Firebase Health Check] ❌', error);
        setStatus({
          initialized: true,
          connected: false,
          error,
          testCollection: null,
          timestamp: new Date().toISOString()
        });
        if (onStatusChange) onStatusChange(false, error);
        return;
      }

      console.log('[Firebase Health Check] ✅ Firestore initialized');

      // Check 3: Try to perform a simple read operation
      try {
        // Use a test collection that should exist (or will be created on first write)
        // We'll try to read from a collection that likely exists: 'artifacts'
        const testQuery = query(collection(db, 'artifacts'), limit(1));
        const snapshot = await getDocs(testQuery);
        
        console.log('[Firebase Health Check] ✅ Firestore connection successful!', {
          collection: 'artifacts',
          documentCount: snapshot.size,
          empty: snapshot.empty
        });

        setStatus({
          initialized: true,
          connected: true,
          error: null,
          testCollection: {
            name: 'artifacts',
            documentCount: snapshot.size,
            empty: snapshot.empty
          },
          timestamp: new Date().toISOString()
        });

        if (onStatusChange) onStatusChange(true, null);
      } catch (error) {
        console.error('[Firebase Health Check] ❌ Firestore connection failed:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });

        setStatus({
          initialized: true,
          connected: false,
          error: {
            code: error.code,
            message: error.message
          },
          testCollection: null,
          timestamp: new Date().toISOString()
        });

        if (onStatusChange) onStatusChange(false, error.message);
      }
    };

    // Run health check after a short delay to ensure everything is loaded
    const timeoutId = setTimeout(runHealthCheck, 1000);

    return () => clearTimeout(timeoutId);
  }, [enabled, onStatusChange]);

  // This component doesn't render anything visible
  // It only logs to console and updates status
  return null;
};

FirebaseHealthCheck.displayName = 'FirebaseHealthCheck';

