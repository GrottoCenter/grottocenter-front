import {
  FETCH_DOCUMENT_CHILDREN,
  FETCH_DOCUMENT_CHILDREN_FAILURE,
  FETCH_DOCUMENT_CHILDREN_SUCCESS
} from '../actions/Document/GetDocumentChildren';

const initialState = {
  error: null,
  isLoading: false,
  children: []
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DOCUMENT_CHILDREN:
      return {
        ...initialState,
        isLoading: true
      };
    case FETCH_DOCUMENT_CHILDREN_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.error
      };
    case FETCH_DOCUMENT_CHILDREN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        children: action.data
      };
    default:
      return state;
  }
};

export default reducer;
