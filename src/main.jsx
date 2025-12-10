import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Make Firebase config available globally
if (import.meta.env.VITE_FIREBASE_CONFIG) {
  window.__firebase_config = import.meta.env.VITE_FIREBASE_CONFIG;
} else {
  // Demo config for development
  window.__firebase_config = JSON.stringify({
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
  });
}

window.__app_id = import.meta.env.VITE_APP_ID || 'default-app-id';
window.__initial_auth_token = import.meta.env.VITE_INITIAL_AUTH_TOKEN || null;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


