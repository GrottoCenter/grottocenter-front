import {
  FETCH_REGION,
  FETCH_REGION_FAILURE,
  FETCH_REGION_SUCCESS
} from '../actions/Region/GetRegion';

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

    default:
      return state;
  }
};

export default reducer;
