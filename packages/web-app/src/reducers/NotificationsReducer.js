import {
  FETCH_NOTIFICATIONS,
  FETCH_NOTIFICATIONS_FAILURE,
  FETCH_NOTIFICATIONS_SUCCESS
} from '../actions/Notifications/GetNotifications';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  notifications: undefined,
  status: REDUCER_STATUS.IDLE,
  totalCount: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_NOTIFICATIONS:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case FETCH_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        notifications: action.notifications,
        totalCount: action.totalCount
      };
    case FETCH_NOTIFICATIONS_FAILURE:
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
