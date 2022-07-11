import {
  ASSOCIATE_DOCUMENT_TO_ENTRANCE,
  ASSOCIATE_DOCUMENT_TO_ENTRANCE_FAILURE,
  ASSOCIATE_DOCUMENT_TO_ENTRANCE_SUCCESS
} from '../actions/AssociateDocumentToEntrance';

const initialState = {
  error: null,
  loading: false
};

const associateDocumentToEntrance = (state = initialState, action) => {
  switch (action.type) {
    case ASSOCIATE_DOCUMENT_TO_ENTRANCE:
      return {
        ...initialState,
        loading: true
      };
    case ASSOCIATE_DOCUMENT_TO_ENTRANCE_SUCCESS:
      return {
        ...initialState,
        loading: false
      };
    case ASSOCIATE_DOCUMENT_TO_ENTRANCE_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default associateDocumentToEntrance;
