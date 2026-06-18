/**
 * Mock cave-related API endpoints.
 */
export const mockCaveApis = () => {
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/caves/42' },
    { fixture: 'caves/cave-42.json' }
  ).as('getCave');
};
