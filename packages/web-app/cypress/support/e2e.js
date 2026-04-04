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

// Suppress guided tours across all tests.
// Tours read localStorage on mount — pre-setting the key prevents them from auto-launching
// and avoids overlay interference with Cypress selectors.
beforeEach(() => {
  localStorage.setItem('mapTourSeen_v1', 'true');
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
