import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { logger } from '../utils/logger';

// Firebase Configuration
// In production, requires environment variables. In development, uses fallback values.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (import.meta.env.PROD ? undefined : "AIzaSyBge71BrBafsNQM_bCOoANoTmaWgNQMwWQ"),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (import.meta.env.PROD ? undefined : "project-management-dcd11.firebaseapp.com"),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (import.meta.env.PROD ? undefined : "project-management-dcd11"),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (import.meta.env.PROD ? undefined : "project-management-dcd11.firebasestorage.app"),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (import.meta.env.PROD ? undefined : "421714252326"),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (import.meta.env.PROD ? undefined : "1:421714252326:web:05c34fb17286f7c8d84ce7"),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (import.meta.env.PROD ? undefined : "G-LMJV91QG88")
};

// Validate Firebase config in production
if (import.meta.env.PROD) {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(
      `Firebase configuration missing required environment variables: ${missingFields.join(', ')}. ` +
      `Please set VITE_FIREBASE_${missingFields.map(f => f.toUpperCase()).join(', VITE_FIREBASE_')} in your production environment.`
    );
  }
}

// Helper to check if we're in local development
export const isLocalDev = () => {
  // CRITICAL: In production (Vercel), import.meta.env.PROD should be true
  // Always return false if we're in production
  if (import.meta.env.PROD === true) {
    return false; // Always false in production
  }
  // Use Vite's built-in env vars
  if (import.meta.env.DEV !== undefined) {
    return import.meta.env.DEV;
  }
  // Fallback to hostname check (only if PROD is not true)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
  }
  return false;
};

// Log which config source is being used (only in development)
if (import.meta.env.DEV) {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
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
let app, auth, db, analytics;

try {
  const existingApps = getApps();
  
  if (existingApps.length > 0) {
    // Reuse existing app if it exists
    app = existingApps[0];
    if (import.meta.env.DEV) {
      logger.logWithPrefix('Firebase', 'Reusing existing Firebase app');
    }
  } else {
    // Initialize new app with our config
    app = initializeApp(firebaseConfig);
    if (import.meta.env.DEV) {
      logger.logWithPrefix('Firebase', '✅ Initialized with apiKey:', firebaseConfig.apiKey.substring(0, 10) + '...');
    }
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Log environment info (only in development)
  if (import.meta.env.DEV) {
    const isDev = isLocalDev();
    logger.logWithPrefix('Firebase', `${isDev ? 'LOCAL DEV' : 'PRODUCTION'} - Auth and Firestore initialized`);
  }
  
  // Initialize Analytics if supported and measurementId is available
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported && firebaseConfig.measurementId) {
        try {
          analytics = getAnalytics(app);
          if (import.meta.env.DEV) {
            logger.logWithPrefix('Firebase', 'Analytics initialized');
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            logger.warn('Analytics initialization failed:', error);
          }
        }
      } else if (import.meta.env.DEV) {
        logger.logWithPrefix('Firebase', 'Analytics not supported or measurementId not provided');
      }
    });
  }
} catch (error) {
  // Only log error - don't try to re-initialize or use fallback config
  console.error('[Firebase] Error initializing Firebase:', error);
  throw error; // Re-throw to make the error visible
}

export { app, auth, db, analytics };

// Helper to check if demo mode is allowed (only in local dev)
export const isDemoModeAllowed = () => {
  return isLocalDev();
};

export const appId = import.meta.env.VITE_APP_ID ||
  (typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id');

// Helper for Firestore paths
export const getTasksCollection = (uid) =>
  collection(db, 'artifacts', appId, 'users', uid, 'tasks');

export const getTaskDoc = (uid, taskId) =>
  doc(db, 'artifacts', appId, 'users', uid, 'tasks', taskId);

export const getBackupsCollection = (uid) =>
  collection(db, 'artifacts', appId, 'users', uid, 'backups');

