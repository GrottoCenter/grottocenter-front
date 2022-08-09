import {
  CHECK_ROWS_FAILURE,
  CHECK_ROWS_SUCCESS,
  CHECK_ROWS_START,
  IMPORT_ROWS_START,
  IMPORT_ROWS_FAILURE,
  IMPORT_ROWS_SUCCESS,
  RESET_IMPORT_STATE
} from '../actions/ImportCsv';

const initialState = {
  isLoading: false,
  error: null,
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

    case CHECK_ROWS_FAILURE:
    case IMPORT_ROWS_FAILURE:
      return {
        ...state,
        isLoading: false,
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
        ...initialState,
        isLoading: false,
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
