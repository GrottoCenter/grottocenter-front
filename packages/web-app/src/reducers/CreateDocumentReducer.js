import {
  POST_DOCUMENT,
  POST_DOCUMENT_FAILURE,
  POST_DOCUMENT_SUCCESS
} from '../actions/Document/CreateDocument';
import { RESET_DOCUMENT_API_ERRORS } from '../actions/Document/ResetApiErrors';

const initialState = {
  errorMessages: [],
  isLoading: false,
  latestHttpCode: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_DOCUMENT:
      return {
        ...state,
        isLoading: true,
        errorMessages: [],
        latestHttpCode: undefined
      };
    case POST_DOCUMENT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        errorMessages: [],
        latestHttpCode: action.httpCode
      };
    case POST_DOCUMENT_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessages: action.errorMessages,
        latestHttpCode: action.httpCode
      };
    case RESET_DOCUMENT_API_ERRORS:
      return {
        ...state,
        errorMessages: [],
        latestHttpCode: undefined
      };

    default:
      return state;
  }
};

export default reducer;
