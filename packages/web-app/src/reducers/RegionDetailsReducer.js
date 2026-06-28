import {
  FETCH_REGION,
  FETCH_REGION_FAILURE,
  FETCH_REGION_SUCCESS
} from '../actions/Region/GetRegion';
import { POST_GUIDELINE_SUCCESS } from '../actions/Guideline/CreateGuideline';
import { PATCH_GUIDELINE_SUCCESS } from '../actions/Guideline/UpdateGuideline';
import { DELETE_GUIDELINE_SUCCESS } from '../actions/Guideline/DeleteGuideline';
import { RESTORE_GUIDELINE_SUCCESS } from '../actions/Guideline/RestoreGuideline';
import { ROLLBACK_GUIDELINE_SUCCESS } from '../actions/Guideline/RollbackGuideline';

import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE,
  region: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_REGION:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case FETCH_REGION_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        region: action.region
      };
    case FETCH_REGION_FAILURE:
      return {
        ...state,
        error: action.error,
        status: REDUCER_STATUS.FAILED
      };

    case POST_GUIDELINE_SUCCESS: {
      if (
        !state.region ||
        action.guideline.entityType !== 'region' ||
        String(action.guideline.entityId) !== String(state.region.id)
      ) {
        return state;
      }
      const guidelines = state.region.guidelines || [];
      if (guidelines.some(g => g.id === action.guideline.id)) {
        return state;
      }
      return {
        ...state,
        region: {
          ...state.region,
          guidelines: [...guidelines, action.guideline]
        }
      };
    }
    case PATCH_GUIDELINE_SUCCESS:
    case DELETE_GUIDELINE_SUCCESS:
    case RESTORE_GUIDELINE_SUCCESS:
    case ROLLBACK_GUIDELINE_SUCCESS: {
      if (
        !state.region ||
        action.guideline.entityType !== 'region' ||
        String(action.guideline.entityId) !== String(state.region.id)
      ) {
        return state;
      }
      return {
        ...state,
        region: {
          ...state.region,
          guidelines: (state.region.guidelines || []).map(g =>
            g.id === action.guideline.id ? action.guideline : g
          )
        }
      };
    }

    default:
      return state;
  }
};

export default reducer;
