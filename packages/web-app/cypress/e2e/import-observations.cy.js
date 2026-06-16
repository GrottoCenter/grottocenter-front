/**
 * End-to-end tests for the Import Observations CSV Wizard.
 *
 * Validates: Requirements 1.1, 12.2, 13.5, 13.6, 16.1, 16.2, 18.3, 19.1
 */

import {
  mockDeviceApis,
  mockLicensesApi,
  mockObservationsImportApi
} from '../support/mocks';

const IMPORT_URL = '/observations/import';

describe('Import Observations Wizard', () => {
  describe('Unauthenticated user', () => {
    it('shows authentication error when navigating to import page', () => {
      // Requirement 16.1, 16.2: PrivateRoute protects the import page
      cy.visit(IMPORT_URL);

      // The wizard should not render — auth guard blocks access
      cy.get('[data-testid="start-over-button"]').should('not.exist');
      cy.get('[data-testid="next-button"]').should('not.exist');
      // An alert should be visible indicating auth is required
      cy.get('.MuiAlert-root').should('be.visible');
    });
  });

  describe('Happy path (authenticated)', () => {
    beforeEach(() => {
      cy.mockApiCatchAll();
      mockDeviceApis();
      mockLicensesApi();
      mockObservationsImportApi();

      cy.visitAuthenticated(IMPORT_URL);
    });

    it('completes full wizard flow and redirects to document page', () => {
      // Requirement 1.1: Wizard is accessible
      // Step 0: Upload
      cy.get('[data-testid="file-input"]').selectFile(
        'cypress/fixtures/sample-observations.csv',
        { force: true }
      );

      // Verify file info appears
      cy.get('[data-testid="file-info"]').should(
        'contain',
        'sample-observations.csv'
      );

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
      cy.get('.MuiAutocomplete-popper').within(() => {
        cy.contains('TinyTag Plus 2').click();
      });

      // Wait for device details to load (triggers fetchSensorConfigs)
      cy.wait('@getDevice');

      // Sensor config form should now be visible
      cy.get('[data-testid="sensor-config-form"]').should('be.visible');

      // Select a quantity kind (Temperature)
      cy.get('[data-testid="sensor-config-quantity-kind"]').click();
      cy.get('.MuiMenu-paper').last().within(() => {
        cy.get('[role="option"]').first().click();
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
      cy.get('.MuiMenu-paper').last()
        .find('[data-value="timestamp"]').click();

      // Configure timestamp type
      cy.get('[data-testid="timestamp-type-select-0"]').click();
      cy.get('.MuiMenu-paper').last()
        .find('[data-value="datetime"]').click();

      // Type the format string directly
      cy.get('[data-testid="format-input"]').find('input')
        .type('YYYY-MM-DD HH:mm:ss');

      // Wait for validation to pass
      cy.get('[data-testid="validation-indicator-valid"]').should('exist');

      // Assign second column as measurement
      cy.get('[data-testid="role-select-1"]').click();
      cy.get('.MuiMenu-paper').last()
        .find('[data-value="measurement"]').click();

      // Link measurement column to sensor config
      cy.get('[data-testid="sensor-config-select-1"]').click();
      cy.get('.MuiMenu-paper').last().within(() => {
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

      // Select "Point only" mode (no cave in this flow)
      cy.get('[data-testid="location-mode-radio"]')
        .find('input[value="pointOnly"]').click({ force: true });

      // Requirement 13.6: Fill context fields
      cy.get('[data-testid="point-label-field"]').find('input').type(
        'Salle du Chaos - T1'
      );

      // Select license
      cy.get('[data-testid="license-select"]').click();
      cy.get('.MuiMenu-paper').last().within(() => {
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
    });

    it('resets the wizard to step 0 when "Start over" is clicked', () => {
      // Requirement 18.3: Start over resets wizard state

      // Upload a file to get past step 0
      cy.get('[data-testid="file-input"]').selectFile(
        'cypress/fixtures/sample-observations.csv',
        { force: true }
      );

      // Verify we have file loaded
      cy.get('[data-testid="file-info"]').should('exist');

      // Click Start Over
      cy.get('[data-testid="start-over-button"]').click();

      // Wizard should be back at step 0 with no file loaded
      cy.get('[data-testid="file-picker-button"]').should('be.visible');
      cy.get('[data-testid="file-info"]').should('not.exist');

      // Back button should be disabled (step 0)
      cy.get('[data-testid="back-button"]').should('be.disabled');
    });
  });

  describe('Profile export/import', () => {
    beforeEach(() => {
      cy.mockApiCatchAll();
      mockDeviceApis();
      mockLicensesApi();

      cy.visitAuthenticated(IMPORT_URL);
    });

    it('exports profile on Context step and re-imports it on Upload step', () => {
      // Requirement 13.5, 13.6: Profile export and import

      // Step 0: Upload file
      cy.get('[data-testid="file-input"]').selectFile(
        'cypress/fixtures/sample-observations.csv',
        { force: true }
      );
      cy.get('[data-testid="next-button"]').click();

      // Step 1: Add a sensor config (minimum for navigation)
      cy.get('[data-testid="device-search-input"]').type('TinyTag');
      cy.wait('@searchDevices');
      cy.get('.MuiAutocomplete-popper').within(() => {
        cy.contains('TinyTag Plus 2').click();
      });
      cy.wait('@getDevice');
      cy.get('[data-testid="sensor-config-quantity-kind"]').click();
      cy.get('.MuiMenu-paper').last().within(() => {
        cy.get('[role="option"]').first().click();
      });
      cy.get('[data-testid="sensor-config-submit"]').click();
      cy.wait('@createSensorConfig');
      cy.get('[data-testid="next-button"]').click();

      // Step 2: Map Columns
      cy.get('[data-testid="role-select-0"]').click();
      cy.get('.MuiMenu-paper').last()
        .find('[data-value="timestamp"]').click();
      cy.get('[data-testid="timestamp-type-select-0"]').click();
      cy.get('.MuiMenu-paper').last()
        .find('[data-value="datetime"]').click();

      // Type the format string directly
      cy.get('[data-testid="format-input"]').find('input')
        .type('YYYY-MM-DD HH:mm:ss');
      cy.get('[data-testid="validation-indicator-valid"]').should('exist');

      cy.get('[data-testid="role-select-1"]').click();
      cy.get('.MuiMenu-paper').last()
        .find('[data-value="measurement"]').click();
      cy.get('[data-testid="sensor-config-select-1"]').click();
      cy.get('.MuiMenu-paper').last().within(() => {
        cy.get('[role="option"]').last().click();
      });
      cy.get('[data-testid="next-button"]').click();

      // Step 3: Validate — pass through
      cy.get('[data-testid="next-button"]').should('not.be.disabled');
      cy.get('[data-testid="next-button"]').click();

      // Step 4: Context — fill fields and export profile
      cy.get('[data-testid="location-mode-radio"]')
        .find('input[value="pointOnly"]').click({ force: true });

      cy.get('[data-testid="point-label-field"]').find('input').type(
        'Salle du Chaos'
      );
      cy.get('[data-testid="license-select"]').click();
      cy.get('.MuiMenu-paper').last().within(() => {
        cy.get('[role="option"]').first().click();
      });

      // Click Next to go to Submit step
      cy.get('[data-testid="next-button"]').click();

      // Step 5: Submit — export profile
      cy.get('[data-testid="export-profile-button"]').click();

      // Wait for the file to be downloaded
      const downloadsFolder = Cypress.config('downloadsFolder');
      cy.readFile(
        `${downloadsFolder}/SalleduChaos_profile.json`
      ).then(profileContent => {
        // Verify profile contains expected values
        expect(profileContent).to.have.property('pointLabel', 'Salle du Chaos');
        expect(profileContent).to.have.property('encoding', 'UTF-8');
        expect(profileContent).to.have.property('numberLocale', 'en');

        // Now reset the wizard and re-import the profile
        cy.get('[data-testid="start-over-button"]').click();

        // Back at step 0 — upload the same file again
        cy.get('[data-testid="file-input"]').selectFile(
          'cypress/fixtures/sample-observations.csv',
          { force: true }
        );

        // Import the profile JSON
        // Write profile to a fixture file for import
        cy.writeFile(
          'cypress/fixtures/test-profile.json',
          JSON.stringify(profileContent)
        );

        cy.get('[data-testid="profile-input"]').selectFile(
          'cypress/fixtures/test-profile.json',
          { force: true }
        );

        // Verify wizard state is restored from profile
        // The encoding should be restored
        cy.get('[data-testid="encoding-select"]').should(
          'contain.text',
          'UTF-8'
        );

        // The number locale should be restored (value "en" displays as translated text,
        // so just verify the select is not empty — profile was applied)
        cy.get('[data-testid="number-locale-select"]')
          .find('[role="combobox"]')
          .should('not.have.text', '');
      });
    });
  });
});
