import {
  FETCH_SUBSCRIPTIONS,
  FETCH_SUBSCRIPTIONS_FAILURE,
  FETCH_SUBSCRIPTIONS_SUCCESS
} from '../actions/Subscriptions/GetSubscriptions';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE,
  subscriptions: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_SUBSCRIPTIONS:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case FETCH_SUBSCRIPTIONS_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        subscriptions: action.subscriptions
      };
    case FETCH_SUBSCRIPTIONS_FAILURE:
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
