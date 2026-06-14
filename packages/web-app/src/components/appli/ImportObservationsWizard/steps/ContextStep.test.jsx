import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import ContextStep from './ContextStep';

// ---- Redux mock ----
const mockDispatch = jest.fn(() => Promise.resolve());
let mockStoreState = {};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- useUserProperties mock ----
jest.mock('../../../../hooks', () => ({
  useUserProperties: () => ({ id: 1, nickname: 'testuser' }),
  useDebounce: value => value
}));

// ---- CaveAutoCompleteSearch mock ----
jest.mock('../../../common/AutoCompleteSearch/CaveAutoCompleteSearch', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ onSelection, disabled }) =>
      React.createElement('div', { 'data-testid': 'cave-autocomplete-search' },
        React.createElement('button', {
          'data-testid': 'cave-select-button',
          disabled,
          onClick: () => onSelection({ id: 42, name: 'Test Cave' })
        }, 'Select cave')
      )
  };
});

// ---- License action mock ----
jest.mock('../../../../actions/Licenses', () => ({
  fetchLicense: jest.fn(() => ({ type: 'FETCH_LICENSES_LOAD' }))
}));

// ---- Quicksearch action mock ----
jest.mock('../../../../actions/Quicksearch', () => ({
  fetchQuicksearchResult: jest.fn(() => ({ type: 'FETCH_QUICKSEARCH' })),
  resetQuicksearch: jest.fn(() => ({ type: 'RESET_QUICKSEARCH' }))
}));

// ---- Import wizard action mock ----
jest.mock('../../../../actions/Observations/importWizard', () => ({
  SET_CONTEXT: 'SET_CONTEXT',
  SET_DOCUMENT_LANGUAGE: 'SET_DOCUMENT_LANGUAGE',
  SET_SAMPLING_INTERVAL: 'SET_SAMPLING_INTERVAL',
  fetchCaveById: jest.fn(() => () => Promise.resolve(undefined)),
  fetchCaverById: jest.fn(() => () => Promise.resolve(undefined))
}));

// ---- Entity helper mock ----
jest.mock('../../../../helpers/Entity', () => {
  const React = require('react');
  return {
    entityOptionForSelector: jest.fn((props, option) =>
      React.createElement('li', props, option.nickname || option.name || '')
    )
  };
});

// ---- CoordinateFormSection mock ----
jest.mock('../../EntitiesForm/utils/CoordinateFormSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement('div', { 'data-testid': 'coordinate-form-section' })
  };
});

// ---- i18n messages used by ContextStep ----
const messages = {
  'ImportObservationsWizard.ContextStep.caveLabel': 'Cave',
  'ImportObservationsWizard.ContextStep.caveId': 'Cave ID',
  'ImportObservationsWizard.ContextStep.caveIdHelper': 'Enter the numeric ID of the cave',
  'ImportObservationsWizard.ContextStep.pointLabel': 'Point label',
  'ImportObservationsWizard.ContextStep.pointLabelPlaceholder': 'e.g. Main gallery - sensor A',
  'ImportObservationsWizard.ContextStep.authorsLabel': 'Authors',
  'ImportObservationsWizard.ContextStep.authorsNoOptions': 'No caver matches your search (type at least 3 characters)',
  'Type at least {nbOfChars} character(s)': 'Type at least {nbOfChars} character(s)',
  'Choose one or more authors among those already registered. If the author you are looking for does not exist in Grottocenter, it is possible to add him/her using the + button on the right.': 'Choose one or more authors among those already registered. If the author you are looking for does not exist in Grottocenter, it is possible to add him/her using the + button on the right.',
  'new entity': 'new entity',
  'Surname': 'Surname',
  'Caver.Name': 'Name',
  'create': 'Create',
  'ImportObservationsWizard.ContextStep.licenseLabel': 'License',
  'ImportObservationsWizard.ContextStep.loadingLicenses': 'Loading licenses…',
  'ImportObservationsWizard.ContextStep.samplingIntervalLabel': 'Sampling interval (seconds)',
  'ImportObservationsWizard.ContextStep.samplingIntervalHelper': 'Auto-detected from data (seconds); you may adjust it',
  'ImportObservationsWizard.ContextStep.optionalFieldsTitle': 'Optional fields',
  'ImportObservationsWizard.ContextStep.observationName': 'Observation name',
  'ImportObservationsWizard.ContextStep.observationNamePlaceholder':
    'e.g. Summer 2024 monitoring',
  'ImportObservationsWizard.ContextStep.documentTitle': 'Document title',
  'ImportObservationsWizard.ContextStep.latitude': 'Latitude',
  'ImportObservationsWizard.ContextStep.longitude': 'Longitude',
  'ImportObservationsWizard.ContextStep.dataQuality': 'Data quality',
  'ImportObservationsWizard.ContextStep.dataQuality.raw': 'Raw',
  'ImportObservationsWizard.ContextStep.dataQuality.validated': 'Validated',
  'Language': 'Language',
  'Select a language': 'Select a language',
  'Loading...': 'Loading...',
  'English': 'English',
  'French': 'French'
};

// ---- Default Redux state ----
const defaultImportWizardState = {
  encoding: 'UTF-8',
  headerRow: 0,
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
  submission: { status: 'IDLE', error: null, documentId: null },
  documentLanguage: 'eng'
};

const buildState = (overrides = {}) => ({
  importWizard: {
    ...defaultImportWizardState,
    ...overrides,
    context: {
      ...defaultImportWizardState.context,
      ...(overrides.context || {})
    }
  },
  login: {
    authorizationHeader: { Authorization: 'Bearer fake-token' },
    authTokenDecoded: { id: 1, groups: ['User'], nickname: 'testuser' }
  },
  licenses: {
    data: null,
    loading: false,
    error: null
  },
  quicksearch: {
    results: [],
    isLoading: false,
    error: null
  },
  createPerson: {
    isLoading: false,
    caver: null,
    error: null
  },
  language: {
    languages: [
      { id: 'eng', refName: 'English' },
      { id: 'fra', refName: 'French' }
    ],
    isLoaded: true
  }
});

const renderComponent = (props = {}, stateOverrides = {}) => {
  mockStoreState = buildState(stateOverrides);
  return render(
    <IntlProvider locale="en" messages={messages}>
      <ContextStep {...props} />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockDispatch.mockClear();
  mockDispatch.mockImplementation(() => Promise.resolve());
});

describe('ContextStep', () => {
  // Requirements: 11.1
  describe('cave selection', () => {
    it('should render the cave autocomplete search', () => {
      renderComponent({ caveIdLocked: false });

      expect(screen.getByTestId('cave-autocomplete-search')).toBeInTheDocument();
    });

    it('should disable the cave search when caveIdLocked is true', () => {
      renderComponent({ caveIdLocked: true, initialCaveId: 42 });

      const selectButton = screen.getByTestId('cave-select-button');
      expect(selectButton).toBeDisabled();
    });

    it('should dispatch SET_CONTEXT with caveId when a cave is selected', () => {
      renderComponent({ caveIdLocked: false });

      fireEvent.click(screen.getByTestId('cave-select-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_CONTEXT',
        context: { caveId: 42 }
      });
    });
  });

  // Requirements: 11.4
  describe('license dropdown', () => {
    const licensesWithCC = [
      { id: 1, name: 'ODbL' },
      { id: 2, name: 'ODC-BY' },
      { id: 3, name: 'Licence Ouverte' },
      { id: 4, name: 'CC BY-SA' },
      { id: 5, name: 'CC BY' },
      { id: 6, name: 'CC BY-NC' }
    ];

    it('should not display Creative Commons licenses in the license dropdown', () => {
      mockStoreState = {
        ...buildState(),
        licenses: { data: licensesWithCC, loading: false, error: null }
      };

      render(
        <IntlProvider locale="en" messages={messages}>
          <ContextStep />
        </IntlProvider>
      );

      const licenseSelect = screen.getByTestId('license-select');
      expect(licenseSelect).toBeInTheDocument();

      // Open the dropdown
      fireEvent.mouseDown(
        licenseSelect.querySelector('[role="combobox"]') || licenseSelect
      );

      // Verify allowed licenses are present
      expect(screen.getByRole('option', { name: 'ODbL' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'ODC-BY' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Licence Ouverte' })
      ).toBeInTheDocument();

      // Verify Creative Commons licenses are NOT present
      expect(
        screen.queryByRole('option', { name: 'CC BY-SA' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('option', { name: 'CC BY' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('option', { name: 'CC BY-NC' })
      ).not.toBeInTheDocument();
    });

    it('should only show the 3 allowed licenses (ODbL, ODC-BY, Licence Ouverte)', () => {
      mockStoreState = {
        ...buildState(),
        licenses: { data: licensesWithCC, loading: false, error: null }
      };

      render(
        <IntlProvider locale="en" messages={messages}>
          <ContextStep />
        </IntlProvider>
      );

      // Open the dropdown
      const licenseSelect = screen.getByTestId('license-select');
      fireEvent.mouseDown(
        licenseSelect.querySelector('[role="combobox"]') || licenseSelect
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });
  });

  // Requirements: 11.7
  describe('pointLabel field', () => {
    it('should render the point-label field', () => {
      renderComponent();

      const pointLabelField = screen.getByTestId('point-label-field');
      expect(pointLabelField).toBeInTheDocument();
    });

    it('should show an empty point-label field when context.pointLabel is empty', () => {
      renderComponent({}, { context: { ...defaultImportWizardState.context, pointLabel: '' } });

      const pointLabelField = screen.getByTestId('point-label-field');
      const input = pointLabelField.querySelector('input');
      expect(input.value).toBe('');
    });

    it('should dispatch SET_CONTEXT when pointLabel changes', () => {
      renderComponent({}, { context: { ...defaultImportWizardState.context, pointLabel: '' } });

      const pointLabelField = screen.getByTestId('point-label-field');
      const input = pointLabelField.querySelector('input');

      fireEvent.change(input, { target: { value: 'Salle du Chaos' } });

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SET_CONTEXT',
          context: expect.objectContaining({ pointLabel: 'Salle du Chaos' })
        })
      );
    });

    it('should display the placeholder text', () => {
      renderComponent();

      const pointLabelField = screen.getByTestId('point-label-field');
      const input = pointLabelField.querySelector('input');
      expect(input).toHaveAttribute(
        'placeholder',
        'e.g. Main gallery - sensor A'
      );
    });
  });
});
