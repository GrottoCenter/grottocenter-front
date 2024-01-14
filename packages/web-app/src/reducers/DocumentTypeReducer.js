import {
  FETCH_DOCUMENT_TYPES,
  FETCH_DOCUMENT_TYPES_FAILURE,
  FETCH_DOCUMENT_TYPES_SUCCESS
} from '../actions/DocumentType';

const initialState = {
  documentTypes: [],
  error: null,
  isLoading: false,
  isLoaded: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DOCUMENT_TYPES:
      return { ...state, isLoading: true, errorMessages: [] };
    case FETCH_DOCUMENT_TYPES_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isLoaded: true,
        error: null,
        documentTypes: action.documentTypes
      };
    case FETCH_DOCUMENT_TYPES_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
