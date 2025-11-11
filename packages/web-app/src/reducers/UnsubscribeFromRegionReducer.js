import {
  UNSUBSCRIBE_FROM_REGION,
  UNSUBSCRIBE_FROM_REGION_FAILURE,
  UNSUBSCRIBE_FROM_REGION_SUCCESS
} from '../actions/Subscriptions/UnsubscribeFromRegion';

import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: null,
  status: REDUCER_STATUS.IDLE
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UNSUBSCRIBE_FROM_REGION:
      return {
        ...state,
        error: null,
        status: REDUCER_STATUS.LOADING
      };
    case UNSUBSCRIBE_FROM_REGION_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED
      };
    case UNSUBSCRIBE_FROM_REGION_FAILURE:
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
