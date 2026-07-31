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

// Reload the page when a new service worker takes control. With `autoUpdate`
// the new SW installs + skipWaiting'es silently, but the tab keeps running
// the OLD JS/CSS bundles that the current DOM already loaded. Without this,
// users have to hit CTRL+F5 after every deploy to see UI changes (a soft F5
// isn't enough — it goes through the SW and may still hit the previous
// precache depending on activation timing).
//
// Guards:
//  - `wasControlled` skips the very first activation on a fresh install: the
//    initial navigation went to the network (no SW yet), so the page already
//    has the newest assets — reloading would be pointless churn.
//  - `refreshing` prevents a reload loop if `controllerchange` fires twice.
//  - We defer the reload until the tab is hidden so we don't yank the page
//    out from under a user who is reading or mid-form. If the tab is already
//    hidden we reload immediately.
if ('serviceWorker' in navigator) {
  const wasControlled = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;

  const reloadWhenHidden = () => {
    if (document.visibilityState === 'hidden') window.location.reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !wasControlled) return;
    refreshing = true;
    if (document.visibilityState === 'hidden') {
      window.location.reload();
    } else {
      document.addEventListener('visibilitychange', reloadWhenHidden);
    }
  });
}
