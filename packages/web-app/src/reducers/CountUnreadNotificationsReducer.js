import {
  COUNT_UNREAD_NOTIFICATIONS,
  COUNT_UNREAD_NOTIFICATIONS_FAILURE,
  COUNT_UNREAD_NOTIFICATIONS_SUCCESS
} from '../actions/Notifications/CountUnreadNotifications';
import { READ_NOTIFICATION_SUCCESS } from '../actions/Notifications/ReadNotification';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  count: undefined,
  error: undefined,
  status: REDUCER_STATUS.IDLE
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case COUNT_UNREAD_NOTIFICATIONS:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case COUNT_UNREAD_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        count: action.count
      };
    case COUNT_UNREAD_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        error: action.error,
        status: REDUCER_STATUS.FAILED
      };

    // When a notification has been read, decrement nb of unread notifications
    case READ_NOTIFICATION_SUCCESS:
      return {
        ...state,
        count: state.count - 1
      };
    default:
      return state;
  }
};

export default reducer;
