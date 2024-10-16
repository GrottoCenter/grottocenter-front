import {
  FETCH_DOCUMENT_DETAILS,
  FETCH_DOCUMENT_DETAILS_FAILURE,
  FETCH_DOCUMENT_DETAILS_SUCCESS
} from '../actions/Document/GetDocumentDetails';
import {
  DELETE_DOCUMENT_SUCCESS,
  DELETE_DOCUMENT_PERMANENT_SUCCESS
} from '../actions/Document/DeleteDocument';
import { RESTORE_DOCUMENT_SUCCESS } from '../actions/Document/RestoreDocument';

const initialState = {
  error: null,
  isLoading: false,
  details: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DOCUMENT_DETAILS:
      return {
        ...initialState,
        isLoading: true
      };
    case FETCH_DOCUMENT_DETAILS_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.error
      };
    case FETCH_DOCUMENT_DETAILS_SUCCESS:
    case DELETE_DOCUMENT_SUCCESS:
    case DELETE_DOCUMENT_PERMANENT_SUCCESS:
    case RESTORE_DOCUMENT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        details: action.data
      };
    default:
      return state;
  }
};

export default reducer;
