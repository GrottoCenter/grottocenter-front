import {
  CHECK_ROWS_FAILURE,
  CHECK_ROWS_SUCCESS,
  CHECK_ROWS_START,
  IMPORT_ROWS_START,
  IMPORT_ROWS_SUBMITTED,
  IMPORT_ROWS_PROGRESS,
  IMPORT_ROWS_FAILURE,
  IMPORT_ROWS_SUCCESS,
  IMPORT_ROWS_POLL_FAILURE,
  RESET_IMPORT_STATE
} from '../actions/ImportCsv';

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

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case CHECK_ROWS_START:
    case IMPORT_ROWS_START:
      return {
        ...state,
        isLoading: true
      };

    case IMPORT_ROWS_SUBMITTED:
      return {
        ...state,
        isLoading: false,
        isPolling: true,
        batchId: action.payload.batchId,
        status: 'pending',
        progress: {
          totalRows: action.payload.totalRows,
          totalChunks: action.payload.totalChunks,
          completedChunks: 0,
          processedRows: 0,
          successes: 0,
          duplicates: 0,
          failures: 0
        }
      };

    case IMPORT_ROWS_PROGRESS:
      return {
        ...state,
        status: action.payload.status,
        progress: action.payload.progress
      };

    case CHECK_ROWS_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.error
      };

    case IMPORT_ROWS_FAILURE:
      return {
        ...state,
        isLoading: false,
        isPolling: false,
        status: 'failed',
        error: action.error,
        progress: action.progress || state.progress
      };

    case IMPORT_ROWS_POLL_FAILURE:
      return {
        ...state,
        isLoading: false,
        isPolling: false,
        error: action.error
      };

    case CHECK_ROWS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        resultCheck: action.result
      };

    case IMPORT_ROWS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isPolling: false,
        status: action.status || 'completed',
        progress: action.progress || state.progress,
        resultImport: action.result
      };

    case RESET_IMPORT_STATE:
      return {
        ...initialState
      };

    default:
      return state;
  }
};

export default reducer;
