import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import ValidateStep from './ValidateStep';

// ---- Redux mock ----
const mockDispatch = jest.fn();
let mockStoreState = {};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- Utility mocks ----
jest.mock('../utils/timestampBuilder', () => ({
  buildTimestamp: jest.fn()
}));

jest.mock('../utils/numberNormalizer', () => ({
  normalizeNumber: jest.fn()
}));

jest.mock('../utils/samplingIntervalDetector', () => ({
  detectSamplingInterval: jest.fn(() => null)
}));

const { buildTimestamp } = require('../utils/timestampBuilder');
const { normalizeNumber } = require('../utils/numberNormalizer');

// ---- i18n messages used by ValidateStep ----
const messages = {
  'ImportObservationsWizard.ValidateStep.validating': 'Validating data…',
  'ImportObservationsWizard.ValidateStep.allRowsValid': '{count, plural, one {All # row is valid.} other {All # rows are valid.}}',
  'ImportObservationsWizard.ValidateStep.invalidRowsWarning': '{count, plural, one {# row out of {total} is invalid.} other {# rows out of {total} are invalid.}}',
  'ImportObservationsWizard.ValidateStep.rowCountSummary': '{valid} valid rows out of {total}',
  'ImportObservationsWizard.ValidateStep.blockingError.missingSensorConfig': 'All measurement columns must be linked to a sensor configuration before submitting.',
  'ImportObservationsWizard.ValidateStep.blockingError.incompleteTimestamp': 'Timestamp configuration is incomplete. At least one datetime, date, or elapsed_seconds column must be configured.',
  'ImportObservationsWizard.ValidateStep.invalidReason.timestamp': 'Invalid or missing timestamp',
  'ImportObservationsWizard.ValidateStep.invalidReason.noValidNumbers': 'No valid numeric values in measurement columns',
  'ImportObservationsWizard.ValidateStep.invalidRowsTable.rowNumber': 'Row #',
  'ImportObservationsWizard.ValidateStep.invalidRowsTable.reason': 'Reason',
  'ImportObservationsWizard.ValidateStep.invalidRowsTable.sampleValues': 'Sample values'
};

// ---- Base column mappings ----
const TIMESTAMP_MAPPING = {
  columnIndex: 0,
  role: 'timestamp',
  timestampType: 'datetime',
  dateFormat: 'yyyy-MM-dd HH:mm:ss',
  timezone: 'UTC'
};

const MEASUREMENT_MAPPING = {
  columnIndex: 1,
  role: 'measurement',
  sensorConfigurationId: 'sensor-1'
};

const defaultState = {
  importWizard: {
    rawRows: [
      ['datetime', 'temperature'],
      ['2024-01-01 10:00:00', '20.5'],
      ['2024-01-01 10:15:00', '21.0']
    ],
    headerRow: 0,
    skipFirstRows: 0,
    skipLastRows: 0,
    columnMappings: [TIMESTAMP_MAPPING, MEASUREMENT_MAPPING],
    sensorConfigs: [{ id: 'sensor-1', deviceName: 'Sensor A', quantityKind: 'Temperature', unit: '°C' }],
    numberLocale: 'en',
    validationResult: null
  }
};

const renderComponent = (state = defaultState) => {
  mockStoreState = state;
  return render(
    <IntlProvider locale="en" messages={messages}>
      <ValidateStep />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockDispatch.mockClear();
  buildTimestamp.mockReset();
  normalizeNumber.mockReset();
});

describe('ValidateStep', () => {
  // Requirements: 10.6
  it('should disable Next (show blocking error) when a measurement column has no sensorConfigurationId', async () => {
    buildTimestamp.mockReturnValue('2024-01-01T10:00:00.000Z');
    normalizeNumber.mockReturnValue(20.5);

    // Measurement mapping without sensorConfigurationId
    const stateWithUnlinkedMeasurement = {
      importWizard: {
        ...defaultState.importWizard,
        columnMappings: [
          TIMESTAMP_MAPPING,
          { columnIndex: 1, role: 'measurement', sensorConfigurationId: null }
        ],
        validationResult: null
      }
    };

    renderComponent(stateWithUnlinkedMeasurement);

    // The blocking error should be dispatched via SET_VALIDATION_RESULT
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SET_VALIDATION_RESULT',
          validationResult: expect.objectContaining({
            blockingErrors: expect.arrayContaining([expect.any(String)])
          })
        })
      );
    });

    // The dispatched validationResult should have at least one blocking error
    const call = mockDispatch.mock.calls.find(
      c => c[0] && c[0].type === 'SET_VALIDATION_RESULT'
    );
    expect(call[0].validationResult.blockingErrors.length).toBeGreaterThan(0);
  });

  // Requirements: 10.6
  it('should show a blocking error alert when validationResult has blockingErrors', async () => {
    buildTimestamp.mockReturnValue('2024-01-01T10:00:00.000Z');
    normalizeNumber.mockReturnValue(20.5);

    const stateWithBlockingError = {
      importWizard: {
        ...defaultState.importWizard,
        validationResult: {
          totalRows: 2,
          validRows: 0,
          invalidRows: 0,
          blockingErrors: ['All measurement columns must be linked to a sensor configuration before submitting.'],
          invalidRowDetails: []
        }
      }
    };

    renderComponent(stateWithBlockingError);

    await waitFor(() => {
      expect(screen.getByTestId('blocking-error-0')).toBeInTheDocument();
    });
  });

  // Requirements: 10.7
  it('should show warning with invalid row count when some rows are invalid but no blocking errors', async () => {
    buildTimestamp.mockReturnValue('2024-01-01T10:00:00.000Z');
    normalizeNumber.mockReturnValue(20.5);

    const stateWithInvalidRows = {
      importWizard: {
        ...defaultState.importWizard,
        validationResult: {
          totalRows: 5,
          validRows: 3,
          invalidRows: 2,
          blockingErrors: [],
          invalidRowDetails: [
            { rowIndex: 1, reason: 'Invalid or missing timestamp', sampleValues: ['bad', '20'] },
            { rowIndex: 3, reason: 'Invalid or missing timestamp', sampleValues: ['bad2', '21'] }
          ]
        }
      }
    };

    renderComponent(stateWithInvalidRows);

    await waitFor(() => {
      expect(screen.getByTestId('invalid-rows-warning')).toBeInTheDocument();
    });
  });

  // Requirements: 10.8
  it('should show success alert when all rows are valid', async () => {
    buildTimestamp.mockReturnValue('2024-01-01T10:00:00.000Z');
    normalizeNumber.mockReturnValue(20.5);

    const stateAllValid = {
      importWizard: {
        ...defaultState.importWizard,
        validationResult: {
          totalRows: 2,
          validRows: 2,
          invalidRows: 0,
          blockingErrors: [],
          invalidRowDetails: []
        }
      }
    };

    renderComponent(stateAllValid);

    await waitFor(() => {
      expect(screen.getByTestId('validation-success')).toBeInTheDocument();
    });
  });

  // Requirements: 10.8
  it('should limit InvalidRowsTable display to at most 20 rows', async () => {
    // Build 25 invalid rows
    const manyInvalidDetails = Array.from({ length: 25 }, (_, i) => ({
      rowIndex: i,
      reason: 'Invalid or missing timestamp',
      sampleValues: ['val1', 'val2', 'val3']
    }));

    const stateWithManyInvalid = {
      importWizard: {
        ...defaultState.importWizard,
        validationResult: {
          totalRows: 25,
          validRows: 0,
          invalidRows: 25,
          blockingErrors: [],
          invalidRowDetails: manyInvalidDetails
        }
      }
    };

    renderComponent(stateWithManyInvalid);

    // Only 20 rows should be rendered
    await waitFor(() => {
      const renderedRows = screen.queryAllByTestId(/^invalid-row-\d+$/);
      expect(renderedRows.length).toBe(20);
    });
  });

  // Requirements: 10.1 — dispatches SET_VALIDATION_RESULT with correct shape on mount
  it('should dispatch SET_VALIDATION_RESULT on mount', async () => {
    buildTimestamp.mockReturnValue('2024-01-01T10:00:00.000Z');
    normalizeNumber.mockReturnValue(20.5);

    renderComponent(defaultState);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SET_VALIDATION_RESULT',
          validationResult: expect.objectContaining({
            totalRows: expect.any(Number),
            validRows: expect.any(Number),
            invalidRows: expect.any(Number),
            blockingErrors: expect.any(Array),
            invalidRowDetails: expect.any(Array)
          })
        })
      );
    });
  });

  // Requirements: 20.1 — dispatches SET_SAMPLING_INTERVAL on mount
  it('should dispatch SET_SAMPLING_INTERVAL on mount', async () => {
    buildTimestamp.mockReturnValue('2024-01-01T10:00:00.000Z');
    normalizeNumber.mockReturnValue(20.5);

    renderComponent(defaultState);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SET_SAMPLING_INTERVAL' })
      );
    });
  });

  // Requirements: 10.6 — blocking error when no valid timestamp config
  it('should add a blocking error when no valid timestamp configuration is set', async () => {
    buildTimestamp.mockReturnValue(null);
    normalizeNumber.mockReturnValue(20.5);

    const stateNoTimestamp = {
      importWizard: {
        ...defaultState.importWizard,
        columnMappings: [MEASUREMENT_MAPPING], // no timestamp mapping
        validationResult: null
      }
    };

    renderComponent(stateNoTimestamp);

    await waitFor(() => {
      const call = mockDispatch.mock.calls.find(
        c => c[0] && c[0].type === 'SET_VALIDATION_RESULT'
      );
      expect(call).toBeDefined();
      expect(call[0].validationResult.blockingErrors.length).toBeGreaterThan(0);
    });
  });

  // Requirements: 10.7 — invalid row indices account for header and skipFirstRows offset
  it('should report rowIndex relative to the original file (including header and skip offset)', async () => {
    // Row 0 = header, rows 1-2 = skipped, rows 3-4 = data
    buildTimestamp.mockReturnValue(null); // all rows invalid
    normalizeNumber.mockReturnValue(20.5);

    const stateWithSkip = {
      importWizard: {
        ...defaultState.importWizard,
        rawRows: [
          ['datetime', 'temperature'],  // headerRow = 0
          ['skip1', '0'],               // skipFirstRows covers this
          ['skip2', '0'],               // skipFirstRows covers this
          ['2024-01-01 10:00:00', '20.5'], // first data row
          ['2024-01-01 10:15:00', '21.0']  // second data row
        ],
        headerRow: 0,
        skipFirstRows: 2,
        skipLastRows: 0,
        validationResult: null
      }
    };

    renderComponent(stateWithSkip);

    await waitFor(() => {
      const call = mockDispatch.mock.calls.find(
        c => c[0] && c[0].type === 'SET_VALIDATION_RESULT'
      );
      expect(call).toBeDefined();
      // dataStartOffset = headerRow(0) + 1 + skipFirstRows(2) = 3
      // First data row: rowIndex = 3, second: rowIndex = 4
      const { invalidRowDetails } = call[0].validationResult;
      expect(invalidRowDetails).toHaveLength(2);
      expect(invalidRowDetails[0].rowIndex).toBe(3);
      expect(invalidRowDetails[1].rowIndex).toBe(4);
    });
  });
});
