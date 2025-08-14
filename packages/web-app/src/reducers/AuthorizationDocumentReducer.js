import {
  FETCH_AUTHORIZATION_DOCUMENT_DETAILS,
  FETCH_AUTHORIZATION_DOCUMENT_DETAILS_SUCCESS,
  FETCH_AUTHORIZATION_DOCUMENT_DETAILS_FAILURE
} from '../actions/Document/GetAuthorizationDocumentDetails';

const initialState = {
  data: null,
  isLoading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_AUTHORIZATION_DOCUMENT_DETAILS:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case FETCH_AUTHORIZATION_DOCUMENT_DETAILS_SUCCESS:
      return {
        ...state,
        data: action.data,
        isLoading: false,
        error: null
      };
    case FETCH_AUTHORIZATION_DOCUMENT_DETAILS_FAILURE:
      return {
        ...state,
        data: null,
        isLoading: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
