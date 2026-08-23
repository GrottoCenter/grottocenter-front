import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import UploadStep from './UploadStep';

// ---- Notification mock ----
const mockOnError = vi.fn();
const mockOnSuccess = vi.fn();
vi.mock('../../../../hooks', async () => ({
  ...(await vi.importActual('../../../../hooks')),
  useNotification: () => ({
    onError: mockOnError,
    onSuccess: mockOnSuccess
  })
}));

// ---- Redux mock ----
const mockDispatch = vi.fn(() => Promise.resolve());
let mockStoreState = {};

vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- Action mocks ----
const mockParseAndSetFile = vi.fn(() => ({ type: 'PARSE_AND_SET_FILE' }));

// Spreads the real module rather than re-listing its action types: the hooks
// barrel now reaches the store, so ImportWizardReducer is built for every test
// here and a hand-kept list silently goes stale the next time one is added.
vi.mock('../../../../actions/Observations/importWizard', async () => ({
  ...(await vi.importActual('../../../../actions/Observations/importWizard')),
  parseAndSetFile: (...args) => mockParseAndSetFile(...args)
}));

// ---- Profile manager mock ----
vi.mock('../utils/profileManager', () => ({
  importProfile: vi.fn(() => ({ ok: true, state: {} }))
}));

// ---- i18n messages used by UploadStep ----
const messages = {
  'ImportObservationsWizard.UploadStep.fileLabel':
    'Upload CSV / TSV / TXT file',
  'ImportObservationsWizard.UploadStep.dataRowCount':
    '{count, plural, one {# data row} other {# data rows}}',
  'ImportObservationsWizard.UploadStep.encodingLabel': 'Character encoding',
  'ImportObservationsWizard.UploadStep.headerRowLabel': 'Header row',
  'ImportObservationsWizard.UploadStep.noRowsToSkip': 'No rows to skip',
  'ImportObservationsWizard.UploadStep.skipLastRowsLabel': 'Skip last rows',
  'ImportObservationsWizard.UploadStep.skipFirstRowsLabel':
    'Skip first rows (after header)',
  'ImportObservationsWizard.UploadStep.numberLocaleLabel': 'Number format',
  'ImportObservationsWizard.UploadStep.dotDecimal':
    'Dot decimal (e.g. 1,234.56)',
  'ImportObservationsWizard.UploadStep.commaDecimal':
    'Comma decimal (e.g. 1.234,56)',
  'ImportObservationsWizard.UploadStep.importProfile': 'Import profile',
  'ImportObservationsWizard.UploadStep.previewTitle':
    'Data preview (first 10 + last 10 rows)',
  'ImportObservationsWizard.UploadStep.rowLabel': 'Row {row}',
  'ImportObservationsWizard.UploadStep.noDataRows': 'No data rows to preview.',
  'ImportObservationsWizard.UploadStep.profileImportError':
    'Failed to import profile: {error}',
  'ImportObservationsWizard.UploadStep.profileImportSuccess':
    'Profile imported successfully',
  'Drop a file here or click to select': 'Drop a file here or click to select',
  'Drag and drop a file here': 'Drag and drop a file here',
  'Upload a file': 'Upload a file',
  'Choose a file': 'Choose a file',
  'Only .csv, .tsv, or .txt files are accepted.':
    'Only .csv, .tsv, or .txt files are accepted.',
  or: 'or'
};

const createDataTransfer = files => ({
  dataTransfer: {
    files,
    items: files.map(file => ({
      kind: 'file',
      type: file.type,
      getAsFile: () => file
    })),
    types: ['Files']
  }
});

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
    const dropzone = screen.getByRole('button', {
      name: 'Drop a file here or click to select'
    });
    const fileInput = dropzone.querySelector('input[type="file"]');
    const acceptedTypes = fileInput.getAttribute('accept').split(',');

    expect(acceptedTypes).toEqual(
      expect.arrayContaining(['.csv', '.tsv', '.txt'])
    );
  });

  it('should parse an accepted file dropped in the dropzone', async () => {
    renderComponent();
    const dropzone = screen.getByRole('button', {
      name: 'Drop a file here or click to select'
    });
    const file = new File(['col1,col2\n1,2'], 'data.csv', {
      type: 'text/csv'
    });

    fireEvent.drop(dropzone, createDataTransfer([file]));

    await waitFor(() => {
      expect(mockParseAndSetFile).toHaveBeenCalledWith(file, null);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RAW_ROWS',
      rawRows: []
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_COLUMN_MAPPINGS',
      columnMappings: []
    });
  });

  it('should report a rejected file', async () => {
    renderComponent();
    const dropzone = screen.getByRole('button', {
      name: 'Drop a file here or click to select'
    });
    const file = new File(['PDF'], 'document.pdf', {
      type: 'application/pdf'
    });

    fireEvent.drop(dropzone, createDataTransfer([file]));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        'Only .csv, .tsv, or .txt files are accepted.'
      );
    });
    expect(mockParseAndSetFile).not.toHaveBeenCalled();
  });

  it('should clear file-derived data when the selected file is removed', () => {
    renderComponent(stateWithFile);

    fireEvent.click(screen.getByTestId('CancelIcon'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FILE',
      file: null
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RAW_ROWS',
      rawRows: []
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_VALIDATION_RESULT',
      validationResult: null
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SAMPLING_INTERVAL',
      samplingIntervalSeconds: null
    });
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
      expect.objectContaining({
        type: 'SET_ENCODING',
        encoding: 'windows-1252'
      })
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
