import {
  LOAD_DUPLICATE,
  LOAD_DUPLICATE_FAILURE,
  LOAD_DUPLICATE_SUCCESS,
  LOAD_DUPLICATES_LIST,
  LOAD_DUPLICATES_LIST_FAILURE,
  LOAD_DUPLICATES_LIST_SUCCESS,
  DELETE_DUPLICATE,
  DELETE_DUPLICATE_SUCCESS,
  DELETE_DUPLICATE_ERROR,
  CREATE_NEW_ENTITY_FROM_DUPLICATE,
  CREATE_NEW_ENTITY_FROM_DUPLICATE_FAILURE,
  CREATE_NEW_ENTITY_FROM_DUPLICATE_SUCCESS,
  RESET_STATE
} from '../actions/DuplicatesImport';

const initialState = {
  loading: false,
  duplicatesList: [],
  duplicate: null,
  error: null,
  latestHttpCodeOnFetch: null,
  latestHttpCodeOnDelete: null,
  latestHttpCodeOnCreate: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_DUPLICATES_LIST:
    case LOAD_DUPLICATE:
    case CREATE_NEW_ENTITY_FROM_DUPLICATE:
      return {
        ...initialState,
        loading: true
      };
    case LOAD_DUPLICATES_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        duplicatesList: action.duplicates,
        latestHttpCodeOnFetch: action.httpCode
      };
    case LOAD_DUPLICATE_SUCCESS:
      return {
        ...state,
        loading: false,
        duplicate: action.duplicate,
        latestHttpCodeOnFetch: action.httpCode
      };
    case LOAD_DUPLICATES_LIST_FAILURE:
    case LOAD_DUPLICATE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.error,
        latestHttpCodeOnFetch: action.httpCode
      };
    case CREATE_NEW_ENTITY_FROM_DUPLICATE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.error,
        latestHttpCodeOnCreate: action.httpCode
      };
    case DELETE_DUPLICATE:
      return {
        ...state,
        latestHttpCodeOnDelete: null,
        loading: true
      };
    case DELETE_DUPLICATE_SUCCESS:
      return {
        ...state,
        loading: false,
        latestHttpCodeOnDelete: action.httpCode
      };
    case DELETE_DUPLICATE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error,
        latestHttpCodeOnDelete: action.httpCode
      };
    case CREATE_NEW_ENTITY_FROM_DUPLICATE_SUCCESS:
      return {
        ...state,
        loading: false,
        latestHttpCodeOnCreate: action.httpCode
      };
    case RESET_STATE:
      return initialState;
    default:
      return state;
  }
};

export default reducer;
