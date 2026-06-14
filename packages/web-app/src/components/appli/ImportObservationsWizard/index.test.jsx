import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import ImportObservationsWizard from './index';

// ---- Mock step components to isolate wizard logic ----
jest.mock('./steps/UploadStep', () => () => <div data-testid="upload-step" />);
jest.mock('./steps/DeviceSensorsStep', () => () => (
  <div data-testid="device-sensors-step" />
));
jest.mock('./steps/MapColumnsStep', () => () => (
  <div data-testid="map-columns-step" />
));
jest.mock('./steps/ValidateStep', () => () => (
  <div data-testid="validate-step" />
));
jest.mock('./steps/ContextStep', () => () => (
  <div data-testid="context-step" />
));
jest.mock('./steps/SubmitStep', () => () => (
  <div data-testid="submit-step" />
));

// ---- Redux mock ----
const mockDispatch = jest.fn();
let mockStoreState = {};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- i18n messages ----
const messages = {
  'Import observations': 'Import observations',
  'ImportObservationsWizard.step.upload': 'Upload',
  'ImportObservationsWizard.step.deviceSensors': 'Device & Sensors',
  'ImportObservationsWizard.step.mapColumns': 'Map Columns',
  'ImportObservationsWizard.step.validate': 'Validate',
  'ImportObservationsWizard.step.context': 'Context',
  'ImportObservationsWizard.step.submit': 'Submit',
  'ImportObservationsWizard.back': 'Back',
  'ImportObservationsWizard.startOver': 'Start over',
  'ImportObservationsWizard.next': 'Next'
};

const defaultWizardState = {
  currentStep: 0,
  file: null,
  rawRows: [],
  encoding: 'UTF-8',
  headerRow: 0,
  skipFirstRows: 0,
  skipLastRows: 0,
  numberLocale: 'en',
  confirmedDevice: null,
  deviceSearchResults: [],
  sensorConfigs: [],
  sensorConfigsLoading: false,
  sensorConfigsError: null,
  columnMappings: [],
  validationResult: null,
  samplingIntervalSeconds: null,
  context: {
    caveId: null,
    caveIdLocked: false,
    pointLabel: '',
    authorIds: [],
    licenseId: null,
    latitude: null,
    longitude: null,
    observationName: null,
    documentTitle: null,
    dataQuality: 'raw'
  },
  submission: {
    status: 'IDLE',
    error: null,
    documentId: null
  }
};

const renderComponent = (wizardOverrides = {}) => {
  mockStoreState = {
    importWizard: { ...defaultWizardState, ...wizardOverrides }
  };
  return render(
    <IntlProvider locale="en" messages={messages}>
      <ImportObservationsWizard />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockDispatch.mockClear();
});

describe('ImportObservationsWizard — Navigation', () => {
  // Requirements: 18.5
  it('should disable the Back button on step 0', () => {
    renderComponent({ currentStep: 0 });

    const backButton = screen.getByTestId('back-button');
    expect(backButton).toBeDisabled();
  });

  // Requirements: 18.2
  it('should dispatch SET_WIZARD_STEP with decremented step when Back is clicked', () => {
    renderComponent({ currentStep: 2 });

    const backButton = screen.getByTestId('back-button');
    expect(backButton).not.toBeDisabled();

    fireEvent.click(backButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_WIZARD_STEP',
      step: 1
    });
  });

  // Requirements: 18.3
  it('should dispatch RESET_WIZARD when "Start over" is clicked', () => {
    renderComponent({ currentStep: 2 });

    const startOverButton = screen.getByTestId('start-over-button');
    fireEvent.click(startOverButton);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_WIZARD' });
  });
});

describe('ImportObservationsWizard — Step 1 Next button gate', () => {
  // Requirement 7.1: Next disabled when no device confirmed
  it('disables Next when confirmedDevice is null', () => {
    renderComponent({
      currentStep: 1,
      rawRows: [['a'], ['1']],
      confirmedDevice: null,
      sensorConfigs: [{ id: 1, quantityKindCode: 'Temperature', unitSymbol: '°C' }],
      sensorConfigsLoading: false
    });

    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).toBeDisabled();
  });

  // Requirement 7.5: Next disabled while sensor configs are loading
  it('disables Next when sensorConfigsLoading is true', () => {
    renderComponent({
      currentStep: 1,
      rawRows: [['a'], ['1']],
      confirmedDevice: { id: 1, name: 'Device A' },
      sensorConfigs: [],
      sensorConfigsLoading: true
    });

    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).toBeDisabled();
  });

  // Requirement 7.2: Next disabled when sensor configs list is empty
  it('disables Next when sensorConfigs is empty', () => {
    renderComponent({
      currentStep: 1,
      rawRows: [['a'], ['1']],
      confirmedDevice: { id: 1, name: 'Device A' },
      sensorConfigs: [],
      sensorConfigsLoading: false
    });

    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).toBeDisabled();
  });

  // Requirement 7.3: Next enabled when all conditions are met
  it('enables Next when device is confirmed, not loading, and configs exist', () => {
    renderComponent({
      currentStep: 1,
      rawRows: [['a'], ['1']],
      confirmedDevice: { id: 1, name: 'Device A' },
      sensorConfigs: [
        { id: 1, quantityKindCode: 'Temperature', unitSymbol: '°C' }
      ],
      sensorConfigsLoading: false
    });

    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).not.toBeDisabled();
  });

  // Requirement 7.4: Both fetched and newly created configs count
  it('enables Next with multiple sensor configs (fetched + created)', () => {
    renderComponent({
      currentStep: 1,
      rawRows: [['a'], ['1']],
      confirmedDevice: { id: 2, name: 'Logger B' },
      sensorConfigs: [
        { id: 10, quantityKindCode: 'Temperature', unitSymbol: '°C' },
        { id: 11, quantityKindCode: 'RelativeHumidity', unitSymbol: '%' }
      ],
      sensorConfigsLoading: false
    });

    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).not.toBeDisabled();
  });
});
