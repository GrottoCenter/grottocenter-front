import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker (PWA). registerType: 'autoUpdate' makes the SW
// update silently in the background; `immediate` registers without waiting.
registerSW({ immediate: true });
