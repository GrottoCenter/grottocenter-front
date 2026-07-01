import {
  FETCH_NOTIFICATIONS,
  FETCH_NOTIFICATIONS_FAILURE,
  FETCH_NOTIFICATIONS_SUCCESS
} from '../actions/Notifications/GetNotifications';
import { READ_NOTIFICATION_SUCCESS } from '../actions/Notifications/ReadNotification';

const initialState = {
  error: undefined,
  notifications: undefined,
  totalCount: undefined,
  isLoading: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_NOTIFICATIONS:
      return {
        ...initialState,
        isLoading: true
      };
    case FETCH_NOTIFICATIONS_SUCCESS:
      return {
        ...initialState,
        notifications: action.notifications,
        totalCount: action.totalCount
      };
    case FETCH_NOTIFICATIONS_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    case READ_NOTIFICATION_SUCCESS:
      if (!state.notifications) return state;
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.notificationId
            ? { ...n, dateReadAt: new Date().toISOString() }
            : n
        )
      };
    default:
      return state;
  }
};

export default reducer;
