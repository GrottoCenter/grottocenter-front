import {
  FETCH_STATISTICS_REGION,
  FETCH_STATISTICS_REGION_FAILURE,
  FETCH_STATISTICS_REGION_SUCCESS
} from '../actions/Region/GetStatisticsRegion';

import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE,
  statistics: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_STATISTICS_REGION:
      return {
        ...initialState,
        status: REDUCER_STATUS.LOADING
      };
    case FETCH_STATISTICS_REGION_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        statistics: action.statistics
      };
    case FETCH_STATISTICS_REGION_FAILURE:
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
