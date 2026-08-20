import {
  FETCH_REGION,
  FETCH_REGION_FAILURE,
  FETCH_REGION_SUCCESS
} from '../actions/Region/GetRegion';
import {
  POST_GUIDELINE_SUCCESS,
  PATCH_GUIDELINE_SUCCESS,
  DELETE_GUIDELINE_SUCCESS,
  DELETE_GUIDELINE_PERMANENT_SUCCESS,
  RESTORE_GUIDELINE_SUCCESS,
  ROLLBACK_GUIDELINE_SUCCESS
} from '../actions/Guideline/actionTypes';

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
        !action.guideline.regions?.some(
          r => String(r?.id ?? r) === String(state.region.id)
        )
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
        !action.guideline.regions?.some(
          r => String(r?.id ?? r) === String(state.region.id)
        )
      ) {
        return state;
      }
      const guidelines = state.region.guidelines || [];
      const exists = guidelines.some(g => g.id === action.guideline.id);
      return {
        ...state,
        region: {
          ...state.region,
          guidelines: exists
            ? guidelines.map(g =>
                g.id === action.guideline.id ? action.guideline : g
              )
            : [...guidelines, action.guideline]
        }
      };
    }

    // Hard delete: drop the guideline from the list entirely. Removal by id is
    // idempotent, so we don't gate on the response carrying `regions`.
    case DELETE_GUIDELINE_PERMANENT_SUCCESS: {
      if (!state.region) {
        return state;
      }
      return {
        ...state,
        region: {
          ...state.region,
          guidelines: (state.region.guidelines || []).filter(
            g => g.id !== action.guideline.id
          )
        }
      };
    }

    default:
      return state;
  }
};

export default reducer;
