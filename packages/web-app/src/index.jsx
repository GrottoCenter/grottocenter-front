import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// The service worker is registered — and its updates prompted — by
// <UpdatePrompt> (src/components/appli/UpdatePrompt.jsx), so that the "a new
// version is available" UI can live inside the theme and i18n providers.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
