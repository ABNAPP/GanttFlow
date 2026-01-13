/**
 * Centralized application configuration
 * All environment variables and app settings should be accessed through this file
 */

/**
 * Application configuration
 */
export const config = {
  // App metadata
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Gantt App',
    version: import.meta.env.VITE_APP_VERSION || '3.7.0',
    id: import.meta.env.VITE_APP_ID || 
        (typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id'),
  },

  // Firebase configuration
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 
            (import.meta.env.PROD ? undefined : "AIzaSyBge71BrBafsNQM_bCOoANoTmaWgNQMwWQ"),
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 
                (import.meta.env.PROD ? undefined : "project-management-dcd11.firebaseapp.com"),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 
               (import.meta.env.PROD ? undefined : "project-management-dcd11"),
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 
                   (import.meta.env.PROD ? undefined : "project-management-dcd11.firebasestorage.app"),
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 
                       (import.meta.env.PROD ? undefined : "421714252326"),
    appId: import.meta.env.VITE_FIREBASE_APP_ID || 
           (import.meta.env.PROD ? undefined : "1:421714252326:web:05c34fb17286f7c8d84ce7"),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 
                   (import.meta.env.PROD ? undefined : "G-LMJV91QG88"),
  },

  // Environment detection
  env: {
    isDev: import.meta.env.DEV || false,
    isProd: import.meta.env.PROD || false,
    mode: import.meta.env.MODE || 'development',
  },

  // Auth configuration
  auth: {
    initialToken: import.meta.env.VITE_INITIAL_AUTH_TOKEN || null,
  },
};

/**
 * Helper to check if we're in local development
 * CRITICAL: In production (Vercel), import.meta.env.PROD should be true
 * Always returns false if we're in production
 */
export const isLocalDev = () => {
  // Always return false if we're in production
  if (config.env.isProd === true) {
    return false; // Always false in production
  }
  // Use Vite's built-in env vars
  if (config.env.isDev !== undefined) {
    return config.env.isDev;
  }
  // Fallback to hostname check (only if PROD is not true)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
  }
  return false;
};

/**
 * Get Firebase configuration
 * Returns the Firebase config object with validation
 */
export const getFirebaseConfig = () => {
  return config.firebase;
};

/**
 * Get app configuration
 * Returns the app config object
 */
export const getAppConfig = () => {
  return config.app;
};

/**
 * Check if Firebase config is valid
 * Returns array of missing required fields
 */
export const getMissingFirebaseFields = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  return requiredFields.filter(field => !config.firebase[field]);
};
