import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc } from 'firebase/firestore';

// Firebase Configuration
const getFirebaseConfig = () => {
  // För production (Vercel) - läs från environment variables
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  }
  
  // För development - läs från window (som tidigare)
  if (typeof window !== 'undefined' && window.__firebase_config) {
    try {
      return JSON.parse(window.__firebase_config);
    } catch (error) {
      console.error('Error parsing Firebase config:', error);
    }
  }
  
  // Fallback for development
  return {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
  };
};

let app, auth, db;

try {
  const firebaseConfig = getFirebaseConfig();
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create a minimal fallback
  const fallbackConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
  };
  app = initializeApp(fallbackConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

export const appId = import.meta.env.VITE_APP_ID || 
  (typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id');

// Helper for Firestore paths
export const getTasksCollection = (uid) =>
  collection(db, 'artifacts', appId, 'users', uid, 'tasks');

export const getTaskDoc = (uid, taskId) =>
  doc(db, 'artifacts', appId, 'users', uid, 'tasks', taskId);

export const getBackupsCollection = (uid) =>
  collection(db, 'artifacts', appId, 'users', uid, 'backups');

