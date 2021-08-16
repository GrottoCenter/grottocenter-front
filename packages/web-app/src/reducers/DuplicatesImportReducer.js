import {
  CREATE_NEW_RECORD,
  CREATE_NEW_RECORD_FAILURE,
  CREATE_NEW_RECORD_SUCCESS,
  LOAD_DUPLICATE,
  LOAD_DUPLICATE_FAILURE,
  LOAD_DUPLICATE_SUCCESS,
  LOAD_DUPLICATES_LIST,
  LOAD_DUPLICATES_LIST_FAILURE,
  LOAD_DUPLICATES_LIST_SUCCESS,
  UPDATE_DATABASE,
  UPDATE_DATABASE_FAILURE,
  UPDATE_DATABASE_SUCCESS
} from '../actions/DuplicatesImport';

const initialState = {
  loading: false,
  duplicatesList: [],
  duplicatesListError: null,
  duplicate: null,
  duplicateError: null,
  updateOrCreateError: null,
  latestHttpCode: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_DUPLICATES_LIST:
      return {
        ...state,
        loading: true
      };
    case LOAD_DUPLICATES_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        duplicatesList: action.payload,
        latestHttpCode: action.code
      };
    case LOAD_DUPLICATES_LIST_FAILURE:
      return {
        ...state,
        loading: false,
        duplicatesListError: action.error,
        latestHttpCode: action.code
      };
    case LOAD_DUPLICATE:
      return {
        ...state,
        loading: true
      };
    case LOAD_DUPLICATE_SUCCESS:
      return {
        ...state,
        loading: false,
        duplicate: action.payload,
        latestHttpCode: action.code
      };
    case LOAD_DUPLICATE_FAILURE:
      return {
        ...state,
        loading: false,
        duplicateError: action.error,
        latestHttpCode: action.code
      };
    case UPDATE_DATABASE:
      return {
        ...state,
        loading: true
      };
    case UPDATE_DATABASE_SUCCESS:
      return {
        ...state,
        loading: false,
        latestHttpCode: action.code
      };
    case UPDATE_DATABASE_FAILURE:
      return {
        ...state,
        loading: false,
        updateOrCreateError: action.error,
        latestHttpCode: action.code
      };
    case CREATE_NEW_RECORD:
      return {
        ...state,
        loading: true
      };
    case CREATE_NEW_RECORD_SUCCESS:
      return {
        ...state,
        loading: false,
        latestHttpCode: action.code
      };
    case CREATE_NEW_RECORD_FAILURE:
      return {
        ...state,
        loading: false,
        updateOrCreateError: action.error,
        latestHttpCode: action.code
      };
    default:
      return state;
  }
};

export default reducer;
