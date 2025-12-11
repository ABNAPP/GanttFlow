import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc } from 'firebase/firestore';

// Firebase Configuration
// Uses environment variables with VITE_ prefix if available, otherwise uses hardcoded config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBge71BrBafsNQM_bCOoANoTmaWgNQMwWQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "project-management-dcd11.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-management-dcd11",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "project-management-dcd11.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "421714252326",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:421714252326:web:05c34fb17286f7c8d84ce7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LMJV91QG88"
};

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

// Log which config source is being used
if (import.meta.env.VITE_FIREBASE_API_KEY) {
  console.log('[Firebase] Using environment variables (VITE_FIREBASE_*)');
} else {
  console.log('[Firebase] Using hardcoded config (env vars not set)');
}

// Log environment status
const isDev = isLocalDev();
console.log(`[Firebase] Environment: ${isDev ? 'LOCAL DEV - Demo mode allowed' : 'PRODUCTION - AUTH REQUIRED'}`);
if (typeof window !== 'undefined') {
  console.log(`[Firebase] Hostname: ${window.location.hostname}`);
  console.log(`[Firebase] import.meta.env.DEV: ${import.meta.env.DEV}, import.meta.env.PROD: ${import.meta.env.PROD}`);
  // Debug logs to verify environment detection
  console.log(`[Firebase] DEBUG - isLocalDev(): ${isDev}`);
  console.log(`[Firebase] DEBUG - import.meta.env.DEV: ${import.meta.env.DEV}`);
  console.log(`[Firebase] DEBUG - import.meta.env.PROD: ${import.meta.env.PROD}`);
  console.log(`[Firebase] DEBUG - import.meta.env.MODE: ${import.meta.env.MODE}`);
}

// Initialize Firebase - ensure we only initialize once
let app, auth, db, analytics;

try {
  const existingApps = getApps();
  
  if (existingApps.length > 0) {
    // Reuse existing app if it exists
    app = existingApps[0];
    console.log('[Firebase] Reusing existing Firebase app');
  } else {
    // Initialize new app with our config
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] ✅ Initialized with apiKey:', firebaseConfig.apiKey.substring(0, 10) + '...');
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Log environment info
  const isDev = isLocalDev();
  console.log(`[Firebase] ${isDev ? 'LOCAL DEV' : 'PRODUCTION'} - Auth and Firestore initialized`);
  
  // Initialize Analytics if supported and measurementId is available
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported && firebaseConfig.measurementId) {
        try {
          analytics = getAnalytics(app);
          console.log('[Firebase] Analytics initialized');
        } catch (error) {
          console.warn('[Firebase] Analytics initialization failed:', error);
        }
      } else {
        console.log('[Firebase] Analytics not supported or measurementId not provided');
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
