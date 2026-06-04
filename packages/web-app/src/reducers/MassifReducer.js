import arrFindReplaceOrAdd from './utils';
import swapRelevance from './swapRelevance';
import { POST_GUIDELINE_SUCCESS } from '../actions/Guideline/CreateGuideline';
import { PATCH_GUIDELINE_SUCCESS } from '../actions/Guideline/UpdateGuideline';
import { DELETE_GUIDELINE_SUCCESS } from '../actions/Guideline/DeleteGuideline';
import { RESTORE_GUIDELINE_SUCCESS } from '../actions/Guideline/RestoreGuideline';
import { ROLLBACK_GUIDELINE_SUCCESS } from '../actions/Guideline/RollbackGuideline';
import {
  FETCH_MASSIF,
  FETCH_MASSIF_FAILURE,
  FETCH_MASSIF_SUCCESS
} from '../actions/Massif/GetMassif';
import {
  DELETE_MASSIF_SUCCESS,
  DELETE_MASSIF_PERMANENT_SUCCESS
} from '../actions/Massif/DeleteMassif';
import { RESTORE_MASSIF_SUCCESS } from '../actions/Massif/RestoreMassif';
import { LINK_DOCUMENT_TO_MASSIF_SUCCESS } from '../actions/LinkDocumentToMassif';
import { UNLINK_DOCUMENT_TO_MASSIF_SUCCESS } from '../actions/UnlinkDocumentToMassif';
import { MOVE_DESCRIPTION_RELEVANCE_SUCCESS } from '../actions/Description/MoveRelevance';
import { UPDATE_MASSIF_SUCCESS } from '../actions/Massif/UpdateMassif';
import { MARK_MASSIF_SENSITIVE_SUCCESS } from '../actions/Massif/MarkSensitiveMassif';
import { UNMARK_MASSIF_SENSITIVE_SUCCESS } from '../actions/Massif/UnmarkSensitiveMassif';

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
    case DELETE_MASSIF_SUCCESS:
    case DELETE_MASSIF_PERMANENT_SUCCESS:
    case RESTORE_MASSIF_SUCCESS:
    case UPDATE_MASSIF_SUCCESS:
    case MARK_MASSIF_SENSITIVE_SUCCESS:
    case UNMARK_MASSIF_SENSITIVE_SUCCESS:
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
    case MOVE_DESCRIPTION_RELEVANCE_SUCCESS:
      return {
        ...state,
        massif: {
          ...state.massif,
          descriptions: swapRelevance(
            state.massif?.descriptions ?? [],
            action.moved,
            action.swapped
          )
        }
      };
    case POST_GUIDELINE_SUCCESS: {
      if (
        !state.massif ||
        !action.guideline.massifs?.some(
          m => m?.id === state.massif.id || Number(m) === state.massif.id
        )
      ) {
        return state;
      }
      const guidelines = state.massif.guidelines || [];
      if (guidelines.some(g => g.id === action.guideline.id)) {
        return state;
      }
      return {
        ...state,
        massif: {
          ...state.massif,
          guidelines: [...guidelines, action.guideline]
        }
      };
    }
    case PATCH_GUIDELINE_SUCCESS:
    case DELETE_GUIDELINE_SUCCESS:
    case RESTORE_GUIDELINE_SUCCESS:
    case ROLLBACK_GUIDELINE_SUCCESS: {
      if (
        !state.massif ||
        !action.guideline.massifs?.some(
          m => m?.id === state.massif.id || Number(m) === state.massif.id
        )
      ) {
        return state;
      }
      const guidelines = state.massif.guidelines || [];
      const exists = guidelines.some(g => g.id === action.guideline.id);
      return {
        ...state,
        massif: {
          ...state.massif,
          guidelines: exists
            ? guidelines.map(g => (g.id === action.guideline.id ? action.guideline : g))
            : [...guidelines, action.guideline]
        }
      };
    }
    default:
      return state;
  }
};

export default reducer;
