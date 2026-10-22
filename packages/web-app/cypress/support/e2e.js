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
  const consoleErrors = [];
  const stopCalls = [];
  cy.on('window:before:load', win => {
    appWindow = win;
    const originalStop = win.stop.bind(win);
    Object.assign(win, {
      stop: () => {
        stopCalls.push({ url: win.location.href, stack: new Error().stack });
        originalStop();
      }
    });
    const appConsole = win.console;
    const originalError = appConsole.error.bind(appConsole);
    appConsole.error = (...args) => {
      consoleErrors.push(
        args
          .map(value => value?.stack ?? value?.message ?? String(value))
          .join(' ')
          .slice(0, 2000)
      );
      originalError(...args);
    };
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
          title: appWindow.document.querySelector('h1')?.textContent,
          consoleErrors: consoleErrors.slice(-3),
          stopCalls: stopCalls.slice(-3)
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
