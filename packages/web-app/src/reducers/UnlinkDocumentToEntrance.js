import {
  UNLINK_DOCUMENT_TO_ENTRANCE,
  UNLINK_DOCUMENT_TO_ENTRANCE_FAILURE,
  UNLINK_DOCUMENT_TO_ENTRANCE_SUCCESS
} from '../actions/UnlinkDocumentToEntrance';

const initialState = {
  error: null,
  loading: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UNLINK_DOCUMENT_TO_ENTRANCE:
      return {
        ...initialState,
        loading: true
      };
    case UNLINK_DOCUMENT_TO_ENTRANCE_SUCCESS:
      return {
        ...initialState,
        loading: false
      };
    case UNLINK_DOCUMENT_TO_ENTRANCE_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
