import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { logger } from '../utils/logger';
import { getFirebaseConfig, getMissingFirebaseFields, isLocalDev } from './app';

// Firebase Configuration
// Now using centralized config from app.js
const firebaseConfig = getFirebaseConfig();

// Validate Firebase config - but don't throw, just warn
// This allows the app to continue running in demo mode if Firebase isn't configured
const missingFields = getMissingFirebaseFields();

if (missingFields.length > 0) {
  const errorMessage = `Firebase configuration missing required environment variables: ${missingFields.join(', ')}. ` +
    `Please set VITE_FIREBASE_${missingFields.map(f => f.toUpperCase().replace(/([A-Z])/g, '_$1').slice(1)).join(', VITE_FIREBASE_')} in your environment.`;
  
  if (config.env.isProd) {
    // In production, log error but don't throw - allow app to show error message
    logger.error('[Firebase Config]', errorMessage);
    logger.warn('[Firebase Config]', 'App will run in limited mode. Some features may not work.');
  } else {
    // In development, just warn
    logger.warn('[Firebase Config]', errorMessage);
    logger.warn('[Firebase Config]', 'Using fallback values for development.');
  }
}

// Re-export isLocalDev from app.js for backward compatibility
export { isLocalDev };

// Log which config source is being used (only in development)
import { config } from './app';
if (config.env.isDev) {
  if (config.firebase.apiKey && config.firebase.apiKey !== "AIzaSyBge71BrBafsNQM_bCOoANoTmaWgNQMwWQ") {
    logger.logWithPrefix('Firebase', 'Using environment variables (VITE_FIREBASE_*)');
  } else {
    logger.logWithPrefix('Firebase', 'Using hardcoded config (env vars not set)');
  }
  
  const isDev = isLocalDev();
  logger.logWithPrefix('Firebase', `Environment: ${isDev ? 'LOCAL DEV - Demo mode allowed' : 'PRODUCTION - AUTH REQUIRED'}`);
  if (typeof window !== 'undefined') {
    logger.logWithPrefix('Firebase', `Hostname: ${window.location.hostname}`);
  }
}

// Initialize Firebase - ensure we only initialize once
// Use null as default to indicate initialization failure
let app = null;
let auth = null;
let db = null;
let analytics = null;
let firebaseError = null;

try {
  // Check if we have minimum required config
  const hasMinimumConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
  
  if (!hasMinimumConfig) {
    throw new Error('Firebase configuration is incomplete. Missing required fields.');
  }

  const existingApps = getApps();
  
  if (existingApps.length > 0) {
    // Reuse existing app if it exists
    app = existingApps[0];
    if (config.env.isDev) {
      logger.logWithPrefix('Firebase', 'Reusing existing Firebase app');
    }
  } else {
    // Initialize new app with our config
    app = initializeApp(firebaseConfig);
    if (config.env.isDev) {
      logger.logWithPrefix('Firebase', '✅ Initialized with apiKey:', firebaseConfig.apiKey?.substring(0, 10) + '...');
    }
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Log environment info (only in development)
  if (config.env.isDev) {
    const isDev = isLocalDev();
    logger.logWithPrefix('Firebase', `${isDev ? 'LOCAL DEV' : 'PRODUCTION'} - Auth and Firestore initialized`);
  }
  
  // Initialize Analytics if supported and measurementId is available
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported && firebaseConfig.measurementId) {
        try {
          analytics = getAnalytics(app);
          if (config.env.isDev) {
            logger.logWithPrefix('Firebase', 'Analytics initialized');
          }
        } catch (error) {
          if (config.env.isDev) {
            logger.warn('Analytics initialization failed:', error);
          }
        }
      } else if (config.env.isDev) {
        logger.logWithPrefix('Firebase', 'Analytics not supported or measurementId not provided');
      }
    });
  }
} catch (error) {
  // Store error but don't throw - allow app to continue
  firebaseError = error;
  logger.error('[Firebase] Error initializing Firebase:', error);
  logger.warn('[Firebase] App will run in limited mode. Firebase features will not be available.');
  
  // In development, show more details
  if (config.env.isDev) {
    logger.warn('[Firebase] To fix: Set environment variables or use demo mode (localhost only)');
  }
}

// Export Firebase instances and error state
export { app, auth, db, analytics, firebaseError };

// Helper to check if Firebase is initialized
export const isFirebaseInitialized = () => {
  return app !== null && auth !== null && db !== null;
};

// Helper to get Firebase error message
export const getFirebaseErrorMessage = () => {
  if (!firebaseError) return null;
  
  if (missingFields && missingFields.length > 0) {
    return `Firebase configuration missing: ${missingFields.join(', ')}. Please set environment variables.`;
  }
  
  return firebaseError.message || 'Firebase initialization failed.';
};

// Helper to check if demo mode is allowed (only in local dev)
export const isDemoModeAllowed = () => {
  return isLocalDev();
};

// Get appId from centralized config
import { getAppConfig } from './app';
export const appId = getAppConfig().id;

// Helper for Firestore paths
export const getTasksCollection = (uid) =>
  collection(db, 'artifacts', appId, 'users', uid, 'tasks');

export const getTaskDoc = (uid, taskId) =>
  doc(db, 'artifacts', appId, 'users', uid, 'tasks', taskId);

export const getBackupsCollection = (uid) =>
  collection(db, 'artifacts', appId, 'users', uid, 'backups');

