/**
 * End-to-end tests for the Import Observations CSV Wizard.
 *
 * Validates: Requirements 1.1, 12.2, 13.5, 13.6, 16.1, 16.2, 18.3, 19.1
 */

import {
  mockDeviceApis,
  mockDeviceApisWithConfigs,
  mockLicensesApi,
  mockObservationsImportApi,
  mockCaverApis,
  mockCaveApis
} from '../support/mocks';

const IMPORT_URL = '/observations/import';
const OBSERVATION_FILE_SELECTOR = '[data-testid="observation-file-selector"]';

const selectObservationsFile = () =>
  cy
    .get(OBSERVATION_FILE_SELECTOR)
    .find('input[type="file"]')
    .selectFile('cypress/fixtures/sample-observations.csv', { force: true });

describe('Import Observations Wizard', () => {
  describe('Unauthenticated user', () => {
    it('shows authentication error when navigating to import page', () => {
      // Requirement 16.1, 16.2: PrivateRoute protects the import page
      cy.visit(IMPORT_URL);

      // The wizard should not render — auth guard blocks access
      cy.get('[data-testid="start-over-button"]').should('not.exist');
      cy.get('[data-testid="next-button"]').should('not.exist');
      // An alert should be visible indicating auth is required
      cy.get('[data-testid="auth-error-alert"]').should('be.visible');
    });
  });

  describe('Happy path (authenticated)', () => {
    beforeEach(() => {
      cy.mockApiCatchAll();
      mockDeviceApis();
      mockLicensesApi();
      mockObservationsImportApi();
      mockCaverApis();

      cy.visitAuthenticated(IMPORT_URL);
      cy.checkPageLoaded();
    });

    it('completes full wizard flow, exports profile, and redirects to document page', () => {
      // Requirement 1.1: Wizard is accessible
      // Step 0: Upload
      selectObservationsFile();

      // Verify file info appears
      cy.get(OBSERVATION_FILE_SELECTOR).should(
        'contain',
        'sample-observations.csv'
      );
      cy.get('[data-testid="file-info"]').should('be.visible');

      // Verify preview table renders
      cy.get('[data-testid="file-preview-table"]').should('exist');

      // Click Next to go to Device & Sensors step
      cy.get('[data-testid="next-button"]').click();

      // Step 1: Device & Sensors
      cy.get('[data-testid="device-sensors-step"]').should('be.visible');

      // Search for a device
      cy.get('[data-testid="device-search-input"]').type('TinyTag');
      cy.wait('@searchDevices');

      // Select the device from results
      cy.get('[data-testid="device-search-popper"]').within(() => {
        cy.contains('TinyTag Plus 2').click();
      });

      // Wait for device details to load (triggers fetchSensorConfigs)
      cy.wait('@getDevice');

      // Sensor config form should now be visible
      cy.get('[data-testid="sensor-config-form"]').should('be.visible');

      // Select a quantity kind (Temperature)
      cy.get('[data-testid="sensor-config-quantity-kind"]').click();
      cy.get('[data-testid="sensor-config-quantity-kind-menu"]').within(() => {
        cy.get('[role="option"][data-value="1"]').click();
      });

      // Unit is auto-selected; submit the sensor config
      cy.get('[data-testid="sensor-config-submit"]').click();
      cy.wait('@createSensorConfig');

      // Click Next to go to Map Columns step
      cy.get('[data-testid="next-button"]').click();

      // Step 2: Map Columns
      cy.get('[data-testid="map-columns-step"]').should('be.visible');

      // Assign first column as timestamp
      cy.get('[data-testid="role-select-0"]').click();
      cy.get('[data-testid="role-menu-0"]')
        .find('[data-value="timestamp"]')
        .click();

      // Configure timestamp type
      cy.get('[data-testid="timestamp-type-select-0"]').click();
      cy.get('[data-testid="timestamp-type-menu-0"]')
        .find('[data-value="datetime"]')
        .click();

      // Type the format string directly
      cy.get('[data-testid="format-input"]')
        .find('input')
        .type('YYYY-MM-DD HH:mm:ss');

      // Wait for validation to pass
      cy.get('[data-testid="validation-indicator-valid"]').should('exist');

      // Assign second column as measurement
      cy.get('[data-testid="role-select-1"]').click();
      cy.get('[data-testid="role-menu-1"]')
        .find('[data-value="measurement"]')
        .click();

      // Link measurement column to sensor config
      cy.get('[data-testid="sensor-config-select-1"]').click();
      cy.get('[data-testid="sensor-config-menu-1"]').within(() => {
        cy.get('[role="option"]').last().click();
      });

      // Click Next to go to Validate step
      cy.get('[data-testid="next-button"]').click();

      // Step 3: Validate
      cy.get('[data-testid="validate-step"]').should('be.visible');

      // Wait for validation to complete — no blocking errors expected
      cy.get('[data-testid="next-button"]').should('not.be.disabled');

      // Click Next to go to Context step
      cy.get('[data-testid="next-button"]').click();

      // Step 4: Context
      cy.get('[data-testid="context-step"]').should('be.visible');

      // Select "Point only" mode
      cy.get('[data-testid="location-mode-radio"]')
        .find('input[value="pointOnly"]')
        .click({ force: true });

      // Requirement 13.6: Fill context fields
      cy.get('[data-testid="point-label-field"]')
        .find('input')
        .type('Salle du Chaos - T1');

      // Fill coordinates (required in pointOnly mode)
      cy.get('[data-testid="context-step"]').within(() => {
        cy.get('label')
          .contains('Latitude')
          .parent()
          .find('input')
          .type('43.123');
        cy.get('label')
          .contains('Longitude')
          .parent()
          .find('input')
          .type('2.987');
      });

      // Select license
      cy.get('[data-testid="license-select"]').click();
      cy.get('[data-testid="license-menu"]').within(() => {
        cy.get('[role="option"]').first().click();
      });

      // Click Next to go to Submit step
      cy.get('[data-testid="next-button"]').click();

      // Step 5: Submit
      cy.get('[data-testid="submit-step"]').should('be.visible');

      // Verify summary shows expected values
      cy.get('[data-testid="summary-file-name"]').should(
        'contain',
        'sample-observations.csv'
      );
      cy.get('[data-testid="summary-point-label"]').should(
        'contain',
        'Salle du Chaos - T1'
      );

      // Requirement 13.5: Export profile before submitting
      cy.get('[data-testid="export-profile-button"]').click();

      // Verify the profile file was downloaded
      const downloadsFolder = Cypress.config('downloadsFolder');
      cy.readFile(`${downloadsFolder}/SalleduChaos-T1_profile.json`).should(
        'have.property',
        'pointLabel',
        'Salle du Chaos - T1'
      );

      // Requirement 12.2: Submit the import
      cy.get('[data-testid="submit-button"]').click();

      // Wait for the POST request
      cy.wait('@submitImport');

      // Requirement 19.1: Redirect to document page
      cy.url().should('include', '/ui/documents/123');
    });
  });

  describe('Start over resets wizard', () => {
    beforeEach(() => {
      cy.mockApiCatchAll();
      cy.visitAuthenticated(IMPORT_URL);
      cy.checkPageLoaded();
    });

    it('resets the wizard to step 0 when "Start over" is clicked', () => {
      // Requirement 18.3: Start over resets wizard state

      // Upload a file to get past step 0
      selectObservationsFile();

      // Verify we have file loaded
      cy.get('[data-testid="file-info"]').should('exist');

      // Click Start Over
      cy.get('[data-testid="start-over-button"]').click();

      // Wizard should be back at step 0 with no file loaded
      cy.get(OBSERVATION_FILE_SELECTOR).should('be.visible');
      cy.get('[data-testid="file-info"]').should('not.exist');

      // Back button should be disabled (step 0)
      cy.get('[data-testid="back-button"]').should('be.disabled');
    });
  });

  describe('Profile import and submit', () => {
    beforeEach(() => {
      cy.mockApiCatchAll();
      mockDeviceApisWithConfigs();
      mockLicensesApi();
      mockObservationsImportApi();
      mockCaverApis();
      mockCaveApis();

      cy.visitAuthenticated(IMPORT_URL);
      cy.checkPageLoaded();
    });

    it('imports a profile, walks through all steps, and submits', () => {
      // Requirement 13.5: Profile import restores wizard state
      // Uses a static profile fixture with cave, authors, and device references

      // Step 0: Upload file
      selectObservationsFile();

      // Import the profile JSON (static fixture with cave + authors)
      cy.get('[data-testid="profile-input"]').selectFile(
        'cypress/fixtures/test-profile.json',
        { force: true }
      );

      // Verify wizard state is restored from profile
      cy.get('[data-testid="encoding-select"]').should('contain.text', 'UTF-8');
      cy.get('[data-testid="number-locale-select"]')
        .find('[role="combobox"]')
        .should('not.have.text', '');

      // Click Next to go to Device & Sensors step
      cy.get('[data-testid="next-button"]').click();

      // Step 1: Device & Sensors — device should be restored from profile
      cy.get('[data-testid="device-sensors-step"]').should('be.visible');
      cy.wait('@getDevice');

      // Sensor configs should be loaded from the restored device
      cy.get('[data-testid="sensor-config-list"]').should('exist');

      // Click Next to go to Map Columns step
      cy.get('[data-testid="next-button"]').click();

      // Step 2: Map Columns — mappings should be restored from profile
      cy.get('[data-testid="map-columns-step"]').should('be.visible');

      // Timestamp column should already be mapped
      cy.get('[data-testid="validation-indicator-valid"]').should('exist');

      // Click Next to go to Validate step
      cy.get('[data-testid="next-button"]').click();

      // Step 3: Validate
      cy.get('[data-testid="validate-step"]').should('be.visible');
      cy.get('[data-testid="next-button"]').should('not.be.disabled');

      // Click Next to go to Context step
      cy.get('[data-testid="next-button"]').click();

      // Step 4: Context — fields should be restored from profile
      cy.get('[data-testid="context-step"]').should('be.visible');

      // Location mode should be restored as "pointAndCave"
      cy.get('[data-testid="location-mode-radio"]')
        .find('input[value="pointAndCave"]')
        .should('be.checked');

      // Cave should be restored (fetched via GET /caves/42)
      cy.wait('@getCave');

      // Author should be restored (fetched via GET /cavers/1)
      cy.wait('@getCaver');

      // Point label should be restored
      cy.get('[data-testid="point-label-field"]')
        .find('input')
        .should('have.value', 'Salle du Chaos - T1');

      // Click Next to go to Submit step
      cy.get('[data-testid="next-button"]').click();

      // Step 5: Submit
      cy.get('[data-testid="submit-step"]').should('be.visible');

      // Verify summary shows restored values
      cy.get('[data-testid="summary-point-label"]').should(
        'contain',
        'Salle du Chaos - T1'
      );

      // Submit the import
      cy.get('[data-testid="submit-button"]').click();
      cy.wait('@submitImport');

      // Requirement 19.1: Redirect to document page
      cy.url().should('include', '/ui/documents/123');
    });
  });
});
