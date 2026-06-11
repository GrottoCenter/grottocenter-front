/**
 * Mock licenses list API endpoint.
 */
export const mockLicensesApi = () => {
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/licenses' },
    { fixture: 'licenses/list.json' }
  ).as('getLicenses');
};
