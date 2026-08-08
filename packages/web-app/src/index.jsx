import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ensurePersistentStorage } from './utils/offlineCache';

// The service worker is registered — and its updates prompted — by
// <UpdatePrompt> (src/components/appli/UpdatePrompt.jsx), so that the "a new
// version is available" UI can live inside the theme and i18n providers.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Ask for eviction-proof storage, but only for an installed app (home-screen
// PWA or the Android TWA). Installing IS the user telling us they want to keep
// this around — the strongest intent signal available without inventing a
// setting for it. Restricting it to that case also spares a casual visitor
// Firefox's permission prompt, since Chrome (the TWA runtime) never prompts
// and grants installed apps by heuristic anyway. Fire-and-forget: nothing in
// the UI depends on the outcome.
const isInstalledApp =
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;
if (isInstalledApp) ensurePersistentStorage();
