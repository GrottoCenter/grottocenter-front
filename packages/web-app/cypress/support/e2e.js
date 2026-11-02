// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Keep the UI independent of browser language and suppress guided tours.
// Tests can override the language in their visit's onBeforeLoad callback.
beforeEach(() => {
  localStorage.setItem('selectedLanguage', 'en');
  localStorage.setItem('mapTourSeen_v2', 'true');

  // React's error boundary catches failed lazy imports, leaving Cypress to
  // report a missing element or API request. Preserve the original load error.
  const preloadErrors = [];
  cy.on('window:before:load', win => {
    win.addEventListener('vite:preloadError', event => {
      preloadErrors.push(event.payload?.message ?? String(event.payload));
    });
  });
  cy.on('fail', error => {
    if (preloadErrors.length) {
      Object.assign(error, {
        message: `${error.message}\nVite preload errors:\n${preloadErrors.join('\n')}`
      });
    }
    throw error;
  });
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
