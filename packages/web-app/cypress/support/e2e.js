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
  let appWindow = null;
  cy.on('window:before:load', win => {
    appWindow = win;
  });
  cy.on('fail', error => {
    let context = { beforeLoadObserved: Boolean(appWindow) };
    try {
      if (appWindow) {
        context = {
          ...context,
          url: appWindow.location.href,
          tokenPresent: Boolean(
            appWindow.localStorage.getItem('grottocenter_token')
          ),
          online: appWindow.navigator.onLine,
          title: appWindow.document.querySelector('h1')?.textContent
        };
      }
    } catch {
      context.contextUnavailable = true;
    }
    Object.assign(error, {
      message: `${error.message}\nApplication state: ${JSON.stringify(context)}`
    });
    throw error;
  });
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
