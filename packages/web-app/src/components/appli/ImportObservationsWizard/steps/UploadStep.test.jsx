import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import UploadStep from './UploadStep';

// ---- Notification mock ----
const mockOnError = jest.fn();
const mockOnSuccess = jest.fn();
jest.mock('../../../../hooks', () => ({
  ...jest.requireActual('../../../../hooks'),
  useNotification: () => ({
    onError: mockOnError,
    onSuccess: mockOnSuccess
  })
}));

// ---- Redux mock ----
const mockDispatch = jest.fn(() => Promise.resolve());
let mockStoreState = {};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- Action mocks ----
const mockParseAndSetFile = jest.fn(() => ({ type: 'PARSE_AND_SET_FILE' }));

jest.mock('../../../../actions/Observations/importWizard', () => ({
  parseAndSetFile: (...args) => mockParseAndSetFile(...args),
  SET_COLUMN_MAPPINGS: 'SET_COLUMN_MAPPINGS',
  SET_CONFIRMED_DEVICE: 'SET_CONFIRMED_DEVICE',
  SET_CONTEXT: 'SET_CONTEXT',
  SET_DEVICES: 'SET_DEVICES',
  SET_DOCUMENT_LANGUAGE: 'SET_DOCUMENT_LANGUAGE',
  SET_ENCODING: 'SET_ENCODING',
  SET_HEADER_ROW: 'SET_HEADER_ROW',
  SET_NUMBER_LOCALE: 'SET_NUMBER_LOCALE',
  SET_SKIP_FIRST_ROWS: 'SET_SKIP_FIRST_ROWS',
  SET_SKIP_LAST_ROWS: 'SET_SKIP_LAST_ROWS',
  CREATE_SENSOR_CONFIG_SUCCESS: 'CREATE_SENSOR_CONFIG_SUCCESS'
}));

// ---- Profile manager mock ----
jest.mock('../utils/profileManager', () => ({
  importProfile: jest.fn(() => ({ ok: true, state: {} }))
}));

// ---- i18n messages used by UploadStep ----
const messages = {
  'ImportObservationsWizard.UploadStep.fileLabel': 'Upload CSV / TSV / TXT file',
  'ImportObservationsWizard.UploadStep.chooseFile': 'Choose file',
  'ImportObservationsWizard.UploadStep.dataRowCount': '{count, plural, one {# data row} other {# data rows}}',
  'ImportObservationsWizard.UploadStep.encodingLabel': 'Character encoding',
  'ImportObservationsWizard.UploadStep.headerRowLabel': 'Header row',
  'ImportObservationsWizard.UploadStep.noRowsToSkip': 'No rows to skip',
  'ImportObservationsWizard.UploadStep.skipLastRowsLabel': 'Skip last rows',
  'ImportObservationsWizard.UploadStep.skipFirstRowsLabel': 'Skip first rows (after header)',
  'ImportObservationsWizard.UploadStep.numberLocaleLabel': 'Number format',
  'ImportObservationsWizard.UploadStep.dotDecimal': 'Dot decimal (e.g. 1,234.56)',
  'ImportObservationsWizard.UploadStep.commaDecimal': 'Comma decimal (e.g. 1.234,56)',
  'ImportObservationsWizard.UploadStep.importProfile': 'Import profile',
  'ImportObservationsWizard.UploadStep.previewTitle': 'Data preview (first 10 + last 10 rows)',
  'ImportObservationsWizard.UploadStep.rowLabel': 'Row {row}',
  'ImportObservationsWizard.UploadStep.noDataRows': 'No data rows to preview.',
  'ImportObservationsWizard.UploadStep.profileImportError': 'Failed to import profile: {error}',
  'ImportObservationsWizard.UploadStep.profileImportSuccess': 'Profile imported successfully'
};

const defaultState = {
  importWizard: {
    file: null,
    rawRows: [],
    encoding: 'UTF-8',
    headerRow: 0,
    skipFirstRows: 0,
    skipLastRows: 0,
    numberLocale: 'en'
  }
};

const stateWithFile = {
  importWizard: {
    file: new File(['col1,col2\n1,2\n3,4'], 'data.csv', {
      type: 'text/csv'
    }),
    rawRows: [
      ['col1', 'col2'],
      ['1', '2'],
      ['3', '4']
    ],
    encoding: 'UTF-8',
    headerRow: 0,
    skipFirstRows: 0,
    skipLastRows: 0,
    numberLocale: 'en'
  }
};

const renderComponent = (state = defaultState) => {
  mockStoreState = state;
  return render(
    <IntlProvider locale="en" messages={messages}>
      <UploadStep />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockDispatch.mockClear();
  mockParseAndSetFile.mockClear();
  mockOnError.mockClear();
  mockOnSuccess.mockClear();
});

describe('UploadStep', () => {
  // Requirements: 2.9
  it('should accept only .csv, .tsv, .txt file extensions', () => {
    renderComponent();
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveAttribute('accept', '.csv,.tsv,.txt');
  });

  // Requirements: 2.8
  it('should dispatch re-parse when encoding dropdown changes', () => {
    renderComponent(stateWithFile);

    const encodingSelect = screen.getByTestId('encoding-select');

    // MUI Select: click to open, then select option
    fireEvent.mouseDown(
      encodingSelect.querySelector('[role="combobox"]') || encodingSelect
    );

    // Find and click the windows-1252 option in the dropdown
    const option = screen.getByRole('option', { name: 'windows-1252' });
    fireEvent.click(option);

    // Should dispatch SET_ENCODING and then parseAndSetFile
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_ENCODING', encoding: 'windows-1252' })
    );
    expect(mockParseAndSetFile).toHaveBeenCalledWith(
      stateWithFile.importWizard.file,
      'windows-1252'
    );
  });

  // Requirements: 3.7
  it('should dispatch SET_HEADER_ROW and reset column mappings when header row changes', () => {
    renderComponent(stateWithFile);

    const headerRowSelect = screen.getByTestId('header-row-select');

    // Open dropdown
    fireEvent.mouseDown(
      headerRowSelect.querySelector('[role="combobox"]') || headerRowSelect
    );

    // Select the "No rows to skip" option
    const noSkipOption = screen.getByRole('option', { name: /no/i });
    fireEvent.click(noSkipOption);

    // Should dispatch SET_HEADER_ROW with -1
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_HEADER_ROW', headerRow: -1 })
    );

    // Should also dispatch SET_COLUMN_MAPPINGS with empty array
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_COLUMN_MAPPINGS',
        columnMappings: []
      })
    );
  });

  // Requirements: 13.5
  it('should disable "Import profile" button when no file is loaded (rawRows empty)', () => {
    renderComponent(defaultState);

    const importProfileButton = screen.getByTestId('import-profile-button');
    expect(importProfileButton).toBeDisabled();
  });

  // Requirements: 13.5
  it('should enable "Import profile" button when a file is loaded', () => {
    renderComponent(stateWithFile);

    const importProfileButton = screen.getByTestId('import-profile-button');
    expect(importProfileButton).not.toBeDisabled();
  });
});
