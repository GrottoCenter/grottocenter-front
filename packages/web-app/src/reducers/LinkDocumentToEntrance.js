import {
  LINK_DOCUMENT_TO_ENTRANCE,
  LINK_DOCUMENT_TO_ENTRANCE_FAILURE,
  LINK_DOCUMENT_TO_ENTRANCE_SUCCESS
} from '../actions/LinkDocumentToEntrance';

const initialState = {
  error: null,
  loading: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case LINK_DOCUMENT_TO_ENTRANCE:
      return {
        ...initialState,
        loading: true
      };
    case LINK_DOCUMENT_TO_ENTRANCE_SUCCESS:
      return {
        ...initialState,
        loading: false
      };
    case LINK_DOCUMENT_TO_ENTRANCE_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
