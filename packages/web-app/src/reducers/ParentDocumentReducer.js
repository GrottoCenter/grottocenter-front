import {
  FETCH_PARENT_DOCUMENT_DETAILS,
  FETCH_PARENT_DOCUMENT_DETAILS_SUCCESS,
  FETCH_PARENT_DOCUMENT_DETAILS_FAILURE
} from '../actions/Document/GetParentDocumentDetails';

const initialState = {
  data: null,
  isLoading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PARENT_DOCUMENT_DETAILS:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case FETCH_PARENT_DOCUMENT_DETAILS_SUCCESS:
      return {
        ...state,
        data: action.data,
        isLoading: false,
        error: null
      };
    case FETCH_PARENT_DOCUMENT_DETAILS_FAILURE:
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
