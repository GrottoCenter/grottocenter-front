import arrFindReplaceOrAdd from './utils';
import {
  FETCH_MASSIF,
  FETCH_MASSIF_FAILURE,
  FETCH_MASSIF_SUCCESS
} from '../actions/Massif/GetMassif';
import { LINK_DOCUMENT_TO_MASSIF_SUCCESS } from '../actions/LinkDocumentToMassif';
import { UNLINK_DOCUMENT_TO_MASSIF_SUCCESS } from '../actions/UnlinkDocumentToMassif';

const initialState = {
  massif: undefined,
  isFetching: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MASSIF:
      return { ...state, massif: action.massif, isFetching: true };
    case FETCH_MASSIF_SUCCESS:
      return { ...state, massif: action.massif, isFetching: false };
    case FETCH_MASSIF_FAILURE:
      return { ...state, error: action.error, isFetching: false };
    case LINK_DOCUMENT_TO_MASSIF_SUCCESS:
      return {
        ...initialState,
        massif: {
          ...state.massif,
          documents: arrFindReplaceOrAdd(
            state.massif.documents,
            e => e.id === action.document.id,
            action.document
          )
        }
      };
    case UNLINK_DOCUMENT_TO_MASSIF_SUCCESS:
      return {
        ...initialState,
        massif: {
          ...state.massif,
          documents: [
            ...state.massif.documents.filter(e => e.id !== action.documentId)
          ]
        }
      };
    default:
      return state;
  }
};

export default reducer;
