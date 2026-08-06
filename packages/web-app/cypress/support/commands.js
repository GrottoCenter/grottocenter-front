// ***********************************************
// Reusable custom commands for Grottocenter e2e tests.
// Loaded automatically via support/e2e.js.
// ***********************************************

/**
 * Creates a fake but structurally valid JWT token that the app's decodeJWT
 * can parse. The payload includes an expiration far in the future.
 */
const createFakeJwt = payload => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'fake-signature';
  return `${header}.${body}.${signature}`;
};

/**
 * Simulate an authenticated session by injecting a JWT into localStorage.
 *
 * @param {object} [options]
 * @param {number} [options.id=1] - User ID
 * @param {string} [options.nickname='TestCaver'] - Display name
 * @param {string[]} [options.groups=['User']] - Role names
 *
 * Usage:
 *   cy.visit('/some-page', { onBeforeLoad: win => cy.loginAs().call(win) });
 *   // or inside beforeEach:
 *   cy.loginAs(); // sets token for subsequent visits via cy.visit wrapper
 */
Cypress.Commands.add(
  'loginAs',
  ({ id = 1, nickname = 'TestCaver', groups = ['User'] } = {}) => {
    const token = createFakeJwt({
      id,
      groups: groups.map((name, idx) => ({ id: idx + 1, name })),
      nickname,
      exp: Math.floor(Date.now() / 1000) + 86400 * 30
    });
    localStorage.setItem('grottocenter_token', token);
  }
);

/**
 * Visit a page as an authenticated user.
 * Combines loginAs + cy.visit in a single call.
 *
 * @param {string} url - The URL to visit
 * @param {object} [authOptions] - Options passed to loginAs
 */
Cypress.Commands.add('visitAuthenticated', (url, authOptions = {}) => {
  cy.loginAs(authOptions);
  cy.visit(url);
});

/**
 * Assert the page loaded successfully (not a blank crash page).
 * Checks that an h1 tag exists and is non-empty.
 *
 * @param {object} [options]
 * @param {number} [options.timeout=15000] - Custom timeout for slow pages
 */
Cypress.Commands.add('checkPageLoaded', ({ timeout = 15000 } = {}) => {
  cy.get('h1', { timeout }).should('exist').should('not.be.empty');
});

/**
 * Intercept all API calls with a 200 empty response.
 * Prevents unexpected 401s from triggering the app's logout flow.
 * Call this BEFORE more specific intercepts (Cypress matches last-registered first).
 *
 * Covers:
 * - /api/v1/** (most endpoints)
 * - /api/convert (projections)
 * - /api/rss/** (RSS feeds)
 */
Cypress.Commands.add('mockApiCatchAll', () => {
  cy.intercept({ pathname: '/api/v1/**' }, { statusCode: 200, body: {} });
  cy.intercept(
    { method: 'GET', pathname: '/api/convert' },
    { statusCode: 200, body: [] }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/rss/**' },
    { statusCode: 200, body: '' }
  );
});
