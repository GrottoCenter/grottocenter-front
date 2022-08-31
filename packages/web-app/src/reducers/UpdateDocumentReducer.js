import { RESET_API_MESSAGES } from '../actions/Document/ResetApiMessages';
import {
  UPDATE_DOCUMENT,
  UPDATE_DOCUMENT_FAILURE,
  UPDATE_DOCUMENT_SUCCESS
} from '../actions/Document/UpdateDocument';

const initialState = {
  errorMessages: [],
  isLoading: false,
  latestHttpCode: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_DOCUMENT:
      return {
        ...state,
        isLoading: true,
        errorMessages: [],
        latestHttpCode: undefined
      };
    case UPDATE_DOCUMENT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        errorMessages: [],
        latestHttpCode: action.httpCode
      };
    case UPDATE_DOCUMENT_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessages: action.errorMessages,
        latestHttpCode: action.httpCode
      };
    case RESET_API_MESSAGES:
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
