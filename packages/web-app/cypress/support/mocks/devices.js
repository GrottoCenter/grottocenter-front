/**
 * Mock device-related API endpoints.
 * Registers intercepts for device search, fetch, and sensor config creation.
 */
export const mockDeviceApis = () => {
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/devices/search' },
    { fixture: 'devices/search-results.json' }
  ).as('searchDevices');

  cy.intercept(
    { method: 'GET', pathname: '/api/v1/devices/1' },
    { fixture: 'devices/tinytag-plus-2.json' }
  ).as('getDevice');

  cy.intercept(
    { method: 'POST', pathname: '/api/v1/devices/1/configurations' },
    { statusCode: 201, fixture: 'sensor-configs/temperature-created.json' }
  ).as('createSensorConfig');
};
