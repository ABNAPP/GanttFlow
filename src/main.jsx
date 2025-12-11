import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Note: Firebase config is now handled directly in firebase.js
// No need to set window.__firebase_config - firebase.js uses env vars or hardcoded config

window.__app_id = import.meta.env.VITE_APP_ID || 'default-app-id';
window.__initial_auth_token = import.meta.env.VITE_INITIAL_AUTH_TOKEN || null;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


