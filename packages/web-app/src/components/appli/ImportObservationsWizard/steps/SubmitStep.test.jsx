import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import SubmitStep from './SubmitStep';

// ---- React Router mock ----
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// ---- Redux mock ----
const mockDispatch = jest.fn();
let mockStoreState = {};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- Action mock ----
jest.mock('../../../../actions/Observations/importWizard', () => ({
  submitObservationsImport: jest.fn()
}));

// ---- Profile manager mock ----
jest.mock('../utils/profileManager', () => ({
  exportProfile: jest.fn(() => ({ mock: 'profile' })),
  deriveProfileFileName: jest.fn(() => 'test_profile.json')
}));

const { submitObservationsImport } = require('../../../../actions/Observations/importWizard');
const { exportProfile, deriveProfileFileName } = require('../utils/profileManager');


// ---- i18n messages used by SubmitStep ----
const messages = {
  'ImportObservationsWizard.SubmitStep.summaryTitle': 'Review',
  'ImportObservationsWizard.SubmitStep.summary.fileName': 'File',
  'ImportObservationsWizard.SubmitStep.summary.caveId': 'Cave ID',
  'ImportObservationsWizard.SubmitStep.summary.pointLabel': 'Point label',
  'ImportObservationsWizard.SubmitStep.summary.sensorConfigs': 'Sensor configurations',
  'ImportObservationsWizard.SubmitStep.summary.validRows': 'Valid rows',
  'ImportObservationsWizard.SubmitStep.noFile': 'No file selected',
  'ImportObservationsWizard.SubmitStep.notSet': 'Not set',
  'ImportObservationsWizard.SubmitStep.submit': 'Submit',
  'ImportObservationsWizard.SubmitStep.submitting': 'Submitting…',
  'ImportObservationsWizard.SubmitStep.exportProfile': 'Export profile',
  'ImportObservationsWizard.SubmitStep.unknownError': 'An unknown error occurred. Please try again.',
  'IMPORT_PARSE_ERROR': 'The file could not be parsed.',
  'IMPORT_VALIDATION_ERROR': 'Profile validation failed.'
};

// ---- Base state factory ----
const makeState = (overrides = {}) => ({
  importWizard: {
    file: { name: 'data.csv' },
    context: {
      caveId: 42,
      pointLabel: 'Salle du Chaos'
    },
    sensorConfigs: [
      { id: 's1', deviceName: 'Sensor A' },
      { id: 's2', deviceName: 'Sensor B' }
    ],
    validationResult: { validRows: 150, invalidRows: 3, totalRows: 153, blockingErrors: [] },
    samplingIntervalSeconds: 900,
    submission: { status: 'IDLE', error: null, documentId: null },
    ...overrides
  }
});

const renderComponent = (stateOverrides = {}) => {
  mockStoreState = makeState(stateOverrides);
  return render(
    <IntlProvider locale="en" messages={messages}>
      <SubmitStep />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockDispatch.mockClear();
  mockNavigate.mockClear();
  submitObservationsImport.mockClear();
  exportProfile.mockClear();
  deriveProfileFileName.mockClear();
});

describe('SubmitStep', () => {
  // Requirements: 12.1 — submit button dispatches submitObservationsImport
  it('should dispatch submitObservationsImport when submit button is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('submit-button'));

    // Verify the action thunk was called and dispatched
    expect(submitObservationsImport).toHaveBeenCalled();
    expect(submitObservationsImport.mock.calls[0][0]).toEqual({ name: 'data.csv' });
    expect(mockDispatch).toHaveBeenCalled();
  });

  // Requirements: 12.3 — submit button disabled during loading
  it('should disable submit button while submission status is LOADING', () => {
    renderComponent({ submission: { status: 'LOADING', error: null, documentId: null } });

    const button = screen.getByTestId('submit-button');
    expect(button).toBeDisabled();
  });

  // Requirements: 12.3 — spinner shown during loading
  it('should show CircularProgress spinner during loading', () => {
    renderComponent({ submission: { status: 'LOADING', error: null, documentId: null } });

    expect(screen.getByTestId('submit-spinner')).toBeInTheDocument();
  });

  // Requirements: 12.3 — spinner not shown when not loading
  it('should not show spinner when not loading', () => {
    renderComponent();

    expect(screen.queryByTestId('submit-spinner')).not.toBeInTheDocument();
  });

  // Requirements: 12.4 — inline error message shown on failure
  it('should show inline error message when submission status is FAILED', () => {
    renderComponent({
      submission: {
        status: 'FAILED',
        error: {
          code: 'IMPORT_PARSE_ERROR',
          message: 'The file could not be parsed.',
          details: [],
          status: 400
        },
        documentId: null
      }
    });

    expect(screen.getByTestId('submit-error-details')).toBeInTheDocument();
    expect(
      screen.getByText('The file could not be parsed.')
    ).toBeInTheDocument();
  });

  // Requirements: 12.4 — inline details shown when details array is non-empty
  it('should show inline error details when details are present', () => {
    renderComponent({
      submission: {
        status: 'FAILED',
        error: {
          code: 'IMPORT_VALIDATION_ERROR',
          message: 'Profile validation failed.',
          details: [
            { field: 'timezone', message: 'Invalid IANA timezone' },
            { field: 'columnMappings', message: 'No timestamp column' }
          ],
          status: 400
        },
        documentId: null
      }
    });

    expect(screen.getByTestId('submit-error-details')).toBeInTheDocument();
    expect(screen.getByTestId('submit-error-details')).toHaveTextContent(
      'timezone: Invalid IANA timezone'
    );
    expect(screen.getByTestId('submit-error-details')).toHaveTextContent(
      'columnMappings: No timestamp column'
    );
  });

  // Requirements: 12.2 — redirect to document page on success
  it('should navigate to document page when submission succeeds', () => {
    // Simulate the real flow: render with IDLE, click submit, then status changes
    const { rerender } = renderComponent({
      submission: { status: 'IDLE', error: null, documentId: null }
    });

    // Click submit to mark the ref
    fireEvent.click(screen.getByTestId('submit-button'));

    // Re-render with SUCCEEDED status (simulating Redux state update)
    mockStoreState = {
      ...mockStoreState,
      importWizard: {
        ...mockStoreState.importWizard,
        submission: { status: 'SUCCEEDED', error: null, documentId: 99 }
      }
    };
    rerender(
      <IntlProvider locale="en" messages={messages}>
        <SubmitStep />
      </IntlProvider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/ui/documents/99', {
      replace: true
    });
  });

  // Requirements: 19.1 — summary shows file name
  it('should display the file name in the summary', () => {
    renderComponent();

    expect(screen.getByTestId('summary-file-name')).toHaveTextContent(
      'data.csv'
    );
  });

  // Requirements: 19.1 — summary shows cave ID
  it('should display the cave ID in the summary', () => {
    renderComponent();

    expect(screen.getByTestId('summary-cave-id')).toHaveTextContent('42');
  });

  // Requirements: 19.1 — summary shows point label
  it('should display the point label in the summary', () => {
    renderComponent();

    expect(screen.getByTestId('summary-point-label')).toHaveTextContent(
      'Salle du Chaos'
    );
  });

  // Requirements: 19.1 — summary shows sensor config count
  it('should display the sensor config count in the summary', () => {
    renderComponent();

    expect(screen.getByTestId('summary-sensor-configs')).toHaveTextContent(
      '2'
    );
  });

  // Requirements: 19.1 — summary shows valid row count
  it('should display the valid row count in the summary', () => {
    renderComponent();

    expect(screen.getByTestId('summary-valid-rows')).toHaveTextContent('150');
  });

  // Requirements: 19.2 — no file fallback message
  it('should display fallback text when no file is loaded', () => {
    renderComponent({ file: null });

    expect(screen.getByTestId('summary-file-name')).toBeInTheDocument();
  });

  // Requirements: 12.2 — no navigation when not yet succeeded
  it('should not navigate when submission status is IDLE', () => {
    renderComponent();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // Requirements: 12.2 — no navigation when status is LOADING
  it('should not navigate when submission status is LOADING', () => {
    renderComponent({
      submission: { status: 'LOADING', error: null, documentId: null }
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // Requirements: 13.6 — export profile button triggers download
  describe('export profile', () => {
    let createObjectURLMock;
    let revokeObjectURLMock;
    let anchorClickSpy;

    beforeEach(() => {
      createObjectURLMock = jest.fn(() => 'blob:mock-url');
      revokeObjectURLMock = jest.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;
      anchorClickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
      delete global.URL.createObjectURL;
      delete global.URL.revokeObjectURL;
      anchorClickSpy.mockRestore();
    });

    it('should call exportProfile and deriveProfileFileName when export button is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('export-profile-button'));

      expect(exportProfile).toHaveBeenCalled();
      expect(deriveProfileFileName).toHaveBeenCalledWith('Salle du Chaos');
    });

    it('should create a blob download with the derived file name', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('export-profile-button'));

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(anchorClickSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  // Requirements: 12.4 — fallback message when error has no message and no details
  it('should show unknown error fallback when error has no message and no details', () => {
    renderComponent({
      submission: {
        status: 'FAILED',
        error: {
          code: null,
          message: null,
          details: [],
          status: null
        },
        documentId: null
      }
    });

    expect(screen.getByTestId('submit-error-details')).toBeInTheDocument();
    expect(
      screen.getByText('An unknown error occurred. Please try again.')
    ).toBeInTheDocument();
  });
});
