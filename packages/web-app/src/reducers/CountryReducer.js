import {
  FETCH_COUNTRY,
  FETCH_COUNTRY_FAILURE,
  FETCH_COUNTRY_SUCCESS
} from '../actions/Country/GetCountry';
import { POST_GUIDELINE_SUCCESS } from '../actions/Guideline/CreateGuideline';
import { PATCH_GUIDELINE_SUCCESS } from '../actions/Guideline/UpdateGuideline';
import { DELETE_GUIDELINE_SUCCESS } from '../actions/Guideline/DeleteGuideline';
import { RESTORE_GUIDELINE_SUCCESS } from '../actions/Guideline/RestoreGuideline';
import { ROLLBACK_GUIDELINE_SUCCESS } from '../actions/Guideline/RollbackGuideline';

import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE,
  country: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_COUNTRY:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case FETCH_COUNTRY_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        country: action.country
      };
    case FETCH_COUNTRY_FAILURE:
      return {
        ...state,
        error: action.error,
        status: REDUCER_STATUS.FAILED
      };

    case POST_GUIDELINE_SUCCESS: {
      if (
        !state.country ||
        !action.guideline.countries?.some(
          c => String(c.id || c) === String(state.country.id)
        )
      ) {
        return state;
      }
      const guidelines = state.country.guidelines || [];
      if (guidelines.some(g => g.id === action.guideline.id)) {
        return state;
      }
      return {
        ...state,
        country: {
          ...state.country,
          guidelines: [...guidelines, action.guideline]
        }
      };
    }
    case PATCH_GUIDELINE_SUCCESS:
    case DELETE_GUIDELINE_SUCCESS:
    case RESTORE_GUIDELINE_SUCCESS:
    case ROLLBACK_GUIDELINE_SUCCESS: {
      if (
        !state.country ||
        !action.guideline.countries?.some(
          c => String(c.id || c) === String(state.country.id)
        )
      ) {
        return state;
      }
      const guidelines = state.country.guidelines || [];
      const exists = guidelines.some(g => g.id === action.guideline.id);
      return {
        ...state,
        country: {
          ...state.country,
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
