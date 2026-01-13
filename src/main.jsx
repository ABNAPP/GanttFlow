import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getAppConfig, config } from './config/app';

// Note: Firebase config is now handled directly in firebase.js
// No need to set window.__firebase_config - firebase.js uses env vars or hardcoded config

// Set app config on window for backward compatibility
const appConfig = getAppConfig();
window.__app_id = appConfig.id;
window.__initial_auth_token = config.auth.initialToken;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


