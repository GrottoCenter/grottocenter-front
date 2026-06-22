/**
 * Mock observations import API endpoint.
 */
export const mockObservationsImportApi = () => {
  cy.intercept(
    { method: 'POST', pathname: '/api/v1/observations/import' },
    { statusCode: 201, fixture: 'observations/import-success.json' }
  ).as('submitImport');
};
