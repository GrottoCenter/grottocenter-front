import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import MapColumnsStep from './MapColumnsStep';

// ---- Redux mock ----
const mockDispatch = jest.fn();
let mockStoreState = {};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- MUI theme mock ----
// The component reads theme.palette.secondary3Color and theme.palette.secondary.veryLight
// secondary3Color = blue[100] = '#BBDEFB'
// secondary.veryLight = orange[50] = '#FFF3E0'
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    palette: {
      secondary3Color: '#BBDEFB',
      secondary: {
        veryLight: '#FFF3E0'
      }
    }
  })
}));

// ---- TimestampFormatInput mock ----
// We mock TimestampFormatInput to isolate integration tests for MapColumnsStep.
// The mock renders a testable element exposing received props and a trigger for onChange.
jest.mock('./TimestampFormatInput', () => {
  const MockTimestampFormatInput = props => (
    <div
      data-testid="mock-format-pill-builder"
      data-timestamp-type={props.timestampType}
      data-current-format={props.currentFormat}
      data-sample-values={JSON.stringify(props.sampleValues)}>
      <button
        data-testid="mock-pill-builder-change"
        onClick={() => props.onChange('YYYY-MM-DD')}
        type="button">
        Trigger onChange
      </button>
    </div>
  );
  MockTimestampFormatInput.displayName = 'MockTimestampFormatInput';
  return MockTimestampFormatInput;
});

// ---- i18n messages used by MapColumnsStep ----
const messages = {
  'ImportObservationsWizard.MapColumnsStep.title': 'Map Columns',
  'ImportObservationsWizard.MapColumnsStep.description': 'Assign a role to each column. Timestamp columns define when measurements were taken. Measurement columns contain numeric sensor readings.',
  'ImportObservationsWizard.MapColumnsStep.columnHeader': 'Column',
  'ImportObservationsWizard.MapColumnsStep.sampleValuesHeader': 'Sample values',
  'ImportObservationsWizard.MapColumnsStep.roleHeader': 'Role',
  'ImportObservationsWizard.MapColumnsStep.selectRole': 'Select role…',
  'ImportObservationsWizard.MapColumnsStep.role.timestamp': 'Timestamp',
  'ImportObservationsWizard.MapColumnsStep.role.measurement': 'Measurement',
  'ImportObservationsWizard.MapColumnsStep.role.decimal_part': 'Decimal part',
  'ImportObservationsWizard.MapColumnsStep.role.excluded': 'Excluded',
  'ImportObservationsWizard.MapColumnsStep.timestampType': 'Timestamp type',
  'ImportObservationsWizard.MapColumnsStep.timestampType.dateOnly': 'Date only',
  'ImportObservationsWizard.MapColumnsStep.timestampType.datetime': 'Date & time',
  'ImportObservationsWizard.MapColumnsStep.timestampType.day': 'Day',
  'ImportObservationsWizard.MapColumnsStep.timestampType.elapsed_seconds': 'Elapsed seconds',
  'ImportObservationsWizard.MapColumnsStep.timestampType.hour': 'Hour',
  'ImportObservationsWizard.MapColumnsStep.timestampType.minute': 'Minute',
  'ImportObservationsWizard.MapColumnsStep.timestampType.month': 'Month',
  'ImportObservationsWizard.MapColumnsStep.timestampType.second': 'Second',
  'ImportObservationsWizard.MapColumnsStep.timestampType.timeOnly': 'Time only',
  'ImportObservationsWizard.MapColumnsStep.timestampType.year': 'Year',
  'ImportObservationsWizard.MapColumnsStep.dateFormat': 'Date format',
  'ImportObservationsWizard.MapColumnsStep.timeFormat': 'Time format',
  'ImportObservationsWizard.MapColumnsStep.timezone': 'Timezone',
  'ImportObservationsWizard.MapColumnsStep.sensorConfig': 'Sensor configuration',
  'ImportObservationsWizard.MapColumnsStep.selectSensor': 'Select sensor…',
  'ImportObservationsWizard.MapColumnsStep.decimalPartFirstColumnError': 'Decimal part cannot be assigned to the first column.',
  'ImportObservationsWizard.MapColumnsStep.decimalPartPrecedingError': 'Decimal part must immediately follow a measurement column.',
  'ImportObservationsWizard.MapColumnsStep.noColumns': 'No columns available. Please upload a file first.',
  'ImportObservationsWizard.MapColumnsStep.medium': 'Medium',
  'ImportObservationsWizard.MapColumnsStep.selectMedium': 'Select medium…',
  'ImportObservationsWizard.MapColumnsStep.medium.water': 'Water',
  'ImportObservationsWizard.MapColumnsStep.medium.air': 'Air',
  'ImportObservationsWizard.MapColumnsStep.medium.soil': 'Soil',
  'ImportObservationsWizard.MapColumnsStep.medium.sediment': 'Sediment',
  'ImportObservationsWizard.MapColumnsStep.medium.cave_wall': 'Cave wall',
  'quantityKind.Temperature': 'Temperature',
  'quantityKind.RelativeHumidity': 'Relative humidity'
};

const renderComponent = (importWizardOverrides = {}) => {
  mockStoreState = {
    importWizard: {
      rawRows: [
        ['ColA', 'ColB', 'ColC'],
        ['1', '2', '3'],
        ['4', '5', '6']
      ],
      headerRow: 0,
      skipFirstRows: 0,
      skipLastRows: 0,
      columnMappings: [],
      sensorConfigs: [],
      ...importWizardOverrides
    }
  };
  return render(
    <IntlProvider locale="en" messages={messages}>
      <MapColumnsStep />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockDispatch.mockClear();
});

describe('MapColumnsStep', () => {
  // Requirements: 7.4 — sensor config dropdown format uses new shape
  describe('measurement config dropdown format', () => {
    it('renders sensor config options with "quantityKindCode (unitSymbol)" format', () => {
      renderComponent({
        columnMappings: [
          { columnIndex: 0, role: 'measurement', sensorConfigurationId: null },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ],
        sensorConfigs: [
          { id: 1, quantityKindCode: 'Temperature', unitSymbol: '°C' },
          { id: 2, quantityKindCode: 'RelativeHumidity', unitSymbol: '%' }
        ]
      });

      // Open the sensor config select for column 0
      const sensorSelect = screen.getByTestId('sensor-config-select-0');
      fireEvent.mouseDown(
        sensorSelect.querySelector('[role="combobox"]') || sensorSelect
      );

      // Verify the options have the expected format
      const tempOption = screen.getByRole('option', {
        name: 'Temperature (°C)'
      });
      const humidOption = screen.getByRole('option', {
        name: 'Relative humidity (%)'
      });

      expect(tempOption).toBeInTheDocument();
      expect(humidOption).toBeInTheDocument();
    });
  });

  // Requirements: 6.5, 6.6
  describe('decimal_part inline errors', () => {
    it('shows decimal-part-error on the first column (index 0)', () => {
      // Column 0 has role decimal_part — invalid because it is the first column
      renderComponent({
        columnMappings: [
          { columnIndex: 0, role: 'decimal_part' },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      expect(
        screen.getByTestId('decimal-part-error-0')
      ).toBeInTheDocument();
    });

    it('does not show decimal-part-error when decimal_part is preceded by a measurement column', () => {
      // Column 0 = measurement, column 1 = decimal_part — this is valid
      renderComponent({
        columnMappings: [
          { columnIndex: 0, role: 'measurement', sensorConfigurationId: null },
          { columnIndex: 1, role: 'decimal_part' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      expect(
        screen.queryByTestId('decimal-part-error-1')
      ).not.toBeInTheDocument();
    });

    it('shows decimal-part-error when decimal_part column is not preceded by a measurement column', () => {
      // Column 0 = excluded, column 1 = decimal_part — invalid because col 0 is not measurement
      renderComponent({
        columnMappings: [
          { columnIndex: 0, role: 'excluded' },
          { columnIndex: 1, role: 'decimal_part' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      expect(
        screen.getByTestId('decimal-part-error-1')
      ).toBeInTheDocument();
    });

    it('shows decimal-part-error when decimal_part column is preceded by a timestamp column', () => {
      // Column 0 = timestamp, column 1 = decimal_part — invalid
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'datetime',
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'decimal_part' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      expect(
        screen.getByTestId('decimal-part-error-1')
      ).toBeInTheDocument();
    });
  });

  // Requirements: 6.7, 6.8
  describe('row background colors', () => {
    it('applies secondary-blue background to a timestamp-role row', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: null,
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      const row = screen.getByTestId('column-row-0');
      // secondary3Color = blue[100] = '#BBDEFB'
      expect(row).toHaveStyle({ backgroundColor: '#BBDEFB' });
    });

    it('applies secondary-orange background to a measurement-role row', () => {
      renderComponent({
        columnMappings: [
          { columnIndex: 0, role: 'measurement', sensorConfigurationId: null },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      const row = screen.getByTestId('column-row-0');
      // secondary.veryLight = orange[50] = '#FFF3E0'
      expect(row).toHaveStyle({ backgroundColor: '#FFF3E0' });
    });

    it('applies no special background to an excluded-role row', () => {
      renderComponent({
        columnMappings: [
          { columnIndex: 0, role: 'excluded' },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      const row = screen.getByTestId('column-row-0');
      expect(row).toHaveStyle({ backgroundColor: 'inherit' });
    });
  });

  // Requirements: 8.1, 8.2, 6.2, 6.3, 6.4
  describe('TimestampFormatInput integration', () => {
    it('renders TimestampFormatInput when timestamp type is datetime', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'datetime',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      expect(
        screen.getByTestId('mock-format-pill-builder')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('mock-format-pill-builder')
      ).toHaveAttribute('data-timestamp-type', 'datetime');
    });

    it('renders TimestampFormatInput when timestamp type is dateOnly', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'dateOnly',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      expect(
        screen.getByTestId('mock-format-pill-builder')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('mock-format-pill-builder')
      ).toHaveAttribute('data-timestamp-type', 'dateOnly');
    });

    it('renders TimestampFormatInput when timestamp type is timeOnly', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'timeOnly',
            dateFormat: null,
            timeFormat: 'HH:mm:ss',
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      expect(
        screen.getByTestId('mock-format-pill-builder')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('mock-format-pill-builder')
      ).toHaveAttribute('data-timestamp-type', 'timeOnly');
    });

    it('does NOT render TimestampFormatInput for elapsed_seconds type', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      expect(
        screen.queryByTestId('mock-format-pill-builder')
      ).not.toBeInTheDocument();
    });

    it('does NOT render TimestampFormatInput for year type', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'year',
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      expect(
        screen.queryByTestId('mock-format-pill-builder')
      ).not.toBeInTheDocument();
    });

    it('passes sample values from column data to TimestampFormatInput', () => {
      renderComponent({
        rawRows: [
          ['Timestamp', 'Value'],
          ['2023-01-01', '10'],
          ['2023-01-02', '20'],
          ['2023-01-03', '30']
        ],
        headerRow: 0,
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'datetime',
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' }
        ]
      });

      const pillBuilder = screen.getByTestId('mock-format-pill-builder');
      const sampleValues = JSON.parse(
        pillBuilder.getAttribute('data-sample-values')
      );

      // sampleValues should contain the column's data (first 10 values sliced)
      expect(sampleValues).toContain('2023-01-01');
      expect(sampleValues).toContain('2023-01-02');
      expect(sampleValues).toContain('2023-01-03');
    });

    it('passes currentFormat from mapping.dateFormat for datetime type', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'datetime',
            dateFormat: 'YYYY/MM/DD HH:mm',
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      const pillBuilder = screen.getByTestId('mock-format-pill-builder');
      expect(pillBuilder).toHaveAttribute(
        'data-current-format',
        'YYYY/MM/DD HH:mm'
      );
    });

    it('passes currentFormat from mapping.timeFormat for timeOnly type', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'timeOnly',
            dateFormat: null,
            timeFormat: 'HH:mm:ss',
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      const pillBuilder = screen.getByTestId('mock-format-pill-builder');
      expect(pillBuilder).toHaveAttribute(
        'data-current-format',
        'HH:mm:ss'
      );
    });

    it('dispatches UPDATE_COLUMN_MAPPING with dateFormat when onChange is called for datetime type', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'datetime',
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      // Trigger the onChange callback via mock button
      fireEvent.click(screen.getByTestId('mock-pill-builder-change'));

      // The component should dispatch an action updating dateFormat
      const allCalls = mockDispatch.mock.calls.map(call => call[0]);

      const updateCall = allCalls.find(
        action =>
          action &&
          action.type === 'UPDATE_COLUMN_MAPPING' &&
          action.columnMapping &&
          action.columnMapping.columnIndex === 0 &&
          action.columnMapping.dateFormat === 'YYYY-MM-DD'
      );

      expect(updateCall).toBeDefined();
    });

    it('dispatches UPDATE_COLUMN_MAPPING with timeFormat when onChange is called for timeOnly type', () => {
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'timeOnly',
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 1, role: 'excluded' },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      // Trigger the onChange callback via mock button
      fireEvent.click(screen.getByTestId('mock-pill-builder-change'));

      // The component should dispatch an action updating timeFormat
      const allCalls = mockDispatch.mock.calls.map(call => call[0]);

      const updateCall = allCalls.find(
        action =>
          action &&
          action.type === 'UPDATE_COLUMN_MAPPING' &&
          action.columnMapping &&
          action.columnMapping.columnIndex === 0 &&
          action.columnMapping.timeFormat === 'YYYY-MM-DD'
      );

      expect(updateCall).toBeDefined();
    });
  });

  // Requirements: 6.9, 7.5
  describe('timestamp type uniqueness', () => {
    it('dispatches action(s) that clear timestampType on col A when col B gets same date type', () => {
      // Column 0 already has role=timestamp, timestampType='date'
      // We will assign role=timestamp to column 1 and change its timestampType to 'date'
      // The component must dispatch action(s) that effectively clear col 0's timestampType
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'dateOnly',
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          {
            columnIndex: 1,
            role: 'timestamp',
            timestampType: null,
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      // Open the timestamp type selector for column 1 and pick 'date'
      const tsTypeSelect = screen.getByTestId('timestamp-type-select-1');
      fireEvent.mouseDown(
        tsTypeSelect.querySelector('[role="combobox"]') || tsTypeSelect
      );

      const dateOption = screen.getByRole('option', { name: 'Date only' });
      fireEvent.click(dateOption);

      // At least one dispatch should have happened
      expect(mockDispatch).toHaveBeenCalled();

      // Collect all dispatched actions
      const allCalls = mockDispatch.mock.calls.map(call => call[0]);

      // Look for evidence that col 0's timestampType was cleared.
      // The component may use UPDATE_COLUMN_MAPPING for col 0 and SET_COLUMN_MAPPINGS or
      // UPDATE_COLUMN_MAPPING for col 1 — either pattern is acceptable.

      // Check for batch SET_COLUMN_MAPPINGS with col 0 cleared
      const batchCall = allCalls.find(
        action =>
          action &&
          action.type === 'SET_COLUMN_MAPPINGS' &&
          Array.isArray(action.columnMappings)
      );

      // Check for individual UPDATE_COLUMN_MAPPING clearing col 0
      const updateCol0Call = allCalls.find(
        action =>
          action &&
          action.type === 'UPDATE_COLUMN_MAPPING' &&
          action.columnMapping &&
          action.columnMapping.columnIndex === 0 &&
          action.columnMapping.timestampType === null
      );

      if (batchCall) {
        // Batch dispatch path: verify col 0 is cleared and col 1 gets 'date'
        const col0 = batchCall.columnMappings.find(m => m.columnIndex === 0);
        expect(col0).toBeDefined();
        expect(col0.timestampType).toBeNull();
      } else {
        // Individual dispatch path: there must be an UPDATE_COLUMN_MAPPING clearing col 0
        expect(updateCol0Call).toBeDefined();
      }

      // Also verify col 1 gets 'date' type in some dispatched action
      const col1GetsDate = allCalls.some(
        action =>
          (action &&
            action.type === 'UPDATE_COLUMN_MAPPING' &&
            action.columnMapping &&
            action.columnMapping.columnIndex === 1 &&
            action.columnMapping.timestampType === 'dateOnly') ||
          (action &&
            action.type === 'SET_COLUMN_MAPPINGS' &&
            Array.isArray(action.columnMappings) &&
            action.columnMappings.some(
              m => m.columnIndex === 1 && m.timestampType === 'dateOnly'
            ))
      );
      expect(col1GetsDate).toBe(true);
    });

    it('does NOT clear other columns when elapsed_seconds is assigned (allows multiple)', () => {
      // Both cols 0 and 1 could have elapsed_seconds
      renderComponent({
        columnMappings: [
          {
            columnIndex: 0,
            role: 'timestamp',
            timestampType: 'elapsed_seconds',
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          {
            columnIndex: 1,
            role: 'timestamp',
            timestampType: null,
            dateFormat: null,
            timeFormat: null,
            timezone: null
          },
          { columnIndex: 2, role: 'excluded' }
        ]
      });

      const tsTypeSelect = screen.getByTestId('timestamp-type-select-1');
      fireEvent.mouseDown(
        tsTypeSelect.querySelector('[role="combobox"]') || tsTypeSelect
      );

      const elapsedOption = screen.getByRole('option', {
        name: 'Elapsed seconds'
      });
      fireEvent.click(elapsedOption);

      // After picking elapsed_seconds for col 1, col 0 should still have elapsed_seconds
      const setMappingsCall = mockDispatch.mock.calls.find(
        call => call[0] && call[0].type === 'SET_COLUMN_MAPPINGS'
      );

      // May dispatch SET_COLUMN_MAPPINGS or UPDATE_COLUMN_MAPPING — either way,
      // col 0's timestampType must remain 'elapsed_seconds'.
      if (setMappingsCall) {
        const col0 = setMappingsCall[0].columnMappings.find(
          m => m.columnIndex === 0
        );
        if (col0) {
          // Must NOT have been cleared
          expect(col0.timestampType).toBe('elapsed_seconds');
        }
      }

      // Also verify col 1 gets elapsed_seconds by checking any dispatched action
      const updateCall = mockDispatch.mock.calls.find(
        call =>
          call[0] &&
          call[0].type === 'UPDATE_COLUMN_MAPPING' &&
          call[0].columnMapping &&
          call[0].columnMapping.columnIndex === 1
      );

      const batchCall = mockDispatch.mock.calls.find(
        call => call[0] && call[0].type === 'SET_COLUMN_MAPPINGS'
      );

      // At least one of these should reflect col 1's new elapsed_seconds type
      if (updateCall) {
        expect(updateCall[0].columnMapping.timestampType).toBe(
          'elapsed_seconds'
        );
      } else if (batchCall) {
        const col1 = batchCall[0].columnMappings.find(
          m => m.columnIndex === 1
        );
        expect(col1.timestampType).toBe('elapsed_seconds');
      } else {
        // A dispatch should have been made
        expect(mockDispatch).toHaveBeenCalled();
      }
    });
  });
});
