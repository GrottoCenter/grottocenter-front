import reducer from '../ImportCsvReducer';
import {
  CHECK_ROWS_START,
  CHECK_ROWS_SUCCESS,
  CHECK_ROWS_FAILURE,
  IMPORT_ROWS_START,
  IMPORT_ROWS_SUBMITTED,
  IMPORT_ROWS_PROGRESS,
  IMPORT_ROWS_SUCCESS,
  IMPORT_ROWS_FAILURE,
  IMPORT_ROWS_POLL_FAILURE,
  RESET_IMPORT_STATE
} from '../../actions/ImportCsv';

const initialState = {
  isLoading: false,
  isPolling: false,
  error: null,
  batchId: null,
  status: null,
  progress: null,
  resultCheck: {
    willBeCreated: null,
    willBeCreatedAsDuplicates: null,
    wontBeCreated: null
  },
  resultImport: null
};

describe('ImportCsvReducer', () => {
  it('returns the initial state when called with undefined state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('handles CHECK_ROWS_START and IMPORT_ROWS_START', () => {
    expect(reducer(initialState, { type: CHECK_ROWS_START }).isLoading).toBe(
      true
    );
    expect(reducer(initialState, { type: IMPORT_ROWS_START }).isLoading).toBe(
      true
    );
  });

  it('handles CHECK_ROWS_SUCCESS and CHECK_ROWS_FAILURE', () => {
    const result = { willBeCreated: [], willBeCreatedAsDuplicates: [], wontBeCreated: [] };
    const successState = reducer(initialState, {
      type: CHECK_ROWS_SUCCESS,
      result
    });
    expect(successState.resultCheck).toEqual(result);
    expect(successState.isLoading).toBe(false);

    const failureState = reducer(initialState, {
      type: CHECK_ROWS_FAILURE,
      error: 'Invalid type of rows.'
    });
    expect(failureState.error).toBe('Invalid type of rows.');
  });

  describe('async entrance flow: SUBMITTED -> PROGRESS -> SUCCESS', () => {
    it('walks through the full sequence without losing batchId/progress', () => {
      const submittedState = reducer(initialState, {
        type: IMPORT_ROWS_SUBMITTED,
        payload: { batchId: 'batch-1', totalRows: 2000, totalChunks: 41 }
      });
      expect(submittedState.isPolling).toBe(true);
      expect(submittedState.isLoading).toBe(false);
      expect(submittedState.batchId).toBe('batch-1');
      expect(submittedState.status).toBe('pending');
      expect(submittedState.progress).toEqual({
        totalRows: 2000,
        totalChunks: 41,
        completedChunks: 0,
        processedRows: 0,
        successes: 0,
        duplicates: 0,
        failures: 0
      });

      const progressPayload = {
        status: 'active',
        progress: {
          totalRows: 2000,
          totalChunks: 41,
          completedChunks: 20,
          processedRows: 980,
          successes: 900,
          duplicates: 50,
          failures: 30
        }
      };
      const progressState = reducer(submittedState, {
        type: IMPORT_ROWS_PROGRESS,
        payload: progressPayload
      });
      expect(progressState.status).toBe('active');
      expect(progressState.progress).toEqual(progressPayload.progress);
      // batchId must survive intermediate progress updates.
      expect(progressState.batchId).toBe('batch-1');

      const finalProgress = {
        totalRows: 2000,
        totalChunks: 41,
        completedChunks: 41,
        processedRows: 2000,
        successes: 1700,
        duplicates: 300,
        failures: 0
      };
      const result = {
        reportUrls: { success: 'url-success', duplicates: 'url-dup', failures: null },
        summary: { successes: 1700, duplicates: 300, failures: 0 }
      };
      const successState = reducer(progressState, {
        type: IMPORT_ROWS_SUCCESS,
        status: 'completed',
        progress: finalProgress,
        result
      });

      expect(successState.isPolling).toBe(false);
      expect(successState.status).toBe('completed');
      // batchId/progress must NOT be wiped on success (unlike the old
      // ...initialState spread), the completed UI needs them.
      expect(successState.batchId).toBe('batch-1');
      expect(successState.progress).toEqual(finalProgress);
      expect(successState.resultImport).toEqual(result);
    });
  });

  describe('async entrance flow: SUBMITTED -> PROGRESS -> FAILURE', () => {
    it('keeps progress.failures available when the job batch fails', () => {
      const submittedState = reducer(initialState, {
        type: IMPORT_ROWS_SUBMITTED,
        payload: { batchId: 'batch-2', totalRows: 100, totalChunks: 2 }
      });

      const progressState = reducer(submittedState, {
        type: IMPORT_ROWS_PROGRESS,
        payload: {
          status: 'active',
          progress: {
            totalRows: 100,
            totalChunks: 2,
            completedChunks: 1,
            processedRows: 50,
            successes: 50,
            duplicates: 0,
            failures: 0
          }
        }
      });

      const failedProgress = {
        totalRows: 100,
        totalChunks: 2,
        completedChunks: 2,
        processedRows: 50,
        successes: 50,
        duplicates: 0,
        failures: 50
      };
      const failureState = reducer(progressState, {
        type: IMPORT_ROWS_FAILURE,
        error: 'The import job failed.',
        progress: failedProgress
      });

      expect(failureState.isPolling).toBe(false);
      expect(failureState.status).toBe('failed');
      expect(failureState.error).toBe('The import job failed.');
      // result stays null on the API's failed path, so the UI must read
      // progress.failures instead of resultImport.
      expect(failureState.resultImport).toBeNull();
      expect(failureState.progress).toEqual(failedProgress);
    });
  });

  it('handles IMPORT_ROWS_POLL_FAILURE (404 / unauthorized batch access)', () => {
    const submittedState = reducer(initialState, {
      type: IMPORT_ROWS_SUBMITTED,
      payload: { batchId: 'batch-3', totalRows: 10, totalChunks: 1 }
    });

    const state = reducer(submittedState, {
      type: IMPORT_ROWS_POLL_FAILURE,
      error: 'Job batch not found.'
    });

    expect(state.isPolling).toBe(false);
    expect(state.error).toBe('Job batch not found.');
  });

  it('handles the synchronous documents flow (no batchId/progress involved)', () => {
    const documentsResult = {
      total: { success: 2, failure: 0, successfulImportAsDuplicates: 0 },
      successfulImport: [{ id: 1 }, { id: 2 }],
      failureImport: [],
      successfulImportAsDuplicates: []
    };
    const state = reducer(initialState, {
      type: IMPORT_ROWS_SUCCESS,
      status: null,
      progress: null,
      result: documentsResult
    });

    expect(state.status).toBe('completed');
    expect(state.batchId).toBeNull();
    expect(state.progress).toBeNull();
    expect(state.resultImport).toEqual(documentsResult);
  });

  it('resets to the initial state on RESET_IMPORT_STATE', () => {
    const dirtyState = reducer(initialState, {
      type: IMPORT_ROWS_SUBMITTED,
      payload: { batchId: 'batch-4', totalRows: 10, totalChunks: 1 }
    });
    expect(reducer(dirtyState, { type: RESET_IMPORT_STATE })).toEqual(
      initialState
    );
  });
});
