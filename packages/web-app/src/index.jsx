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
// No dev guard needed: vite-plugin-pwa is configured with devOptions.enabled
// = false (see vite.config.mjs), so `virtual:pwa-register` exports a no-op
// registerSW in development.
registerSW({ immediate: true });
