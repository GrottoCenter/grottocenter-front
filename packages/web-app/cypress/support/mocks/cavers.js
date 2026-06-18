/**
 * Mock caver-related API endpoints.
 */
export const mockCaverApis = () => {
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/cavers/1' },
    { fixture: 'cavers/caver-1.json' }
  ).as('getCaver');
};
