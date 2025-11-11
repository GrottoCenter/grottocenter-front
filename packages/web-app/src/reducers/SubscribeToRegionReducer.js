import {
  SUBSCRIBE_TO_REGION,
  SUBSCRIBE_TO_REGION_FAILURE,
  SUBSCRIBE_TO_REGION_SUCCESS
} from '../actions/Subscriptions/SubscribeToRegion';

import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: null,
  status: REDUCER_STATUS.IDLE
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SUBSCRIBE_TO_REGION:
      return {
        ...state,
        error: null,
        status: REDUCER_STATUS.LOADING
      };
    case SUBSCRIBE_TO_REGION_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED
      };
    case SUBSCRIBE_TO_REGION_FAILURE:
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
