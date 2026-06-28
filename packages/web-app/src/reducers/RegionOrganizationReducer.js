import {
  SET_REGION_ORGANIZATION,
  SET_REGION_ORGANIZATION_SUCCESS,
  SET_REGION_ORGANIZATION_FAILURE,
  REMOVE_REGION_ORGANIZATION,
  REMOVE_REGION_ORGANIZATION_SUCCESS,
  REMOVE_REGION_ORGANIZATION_FAILURE
} from '../actions/Region/RegionOrganization';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  status: REDUCER_STATUS.IDLE,
  error: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_REGION_ORGANIZATION:
    case REMOVE_REGION_ORGANIZATION:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case SET_REGION_ORGANIZATION_SUCCESS:
    case REMOVE_REGION_ORGANIZATION_SUCCESS:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.SUCCEEDED
      };
    case SET_REGION_ORGANIZATION_FAILURE:
    case REMOVE_REGION_ORGANIZATION_FAILURE:
      return {
        ...state,
        error: action.error,
        status: REDUCER_STATUS.FAILED
      };
    default:
      return state;
  }
};

export default reducer;
