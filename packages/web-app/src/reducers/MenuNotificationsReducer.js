import {
  FETCH_MENU_NOTIFICATIONS,
  FETCH_MENU_NOTIFICATIONS_FAILURE,
  FETCH_MENU_NOTIFICATIONS_SUCCESS
} from '../actions/Notifications/GetMenuNotifications';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  notifications: undefined,
  status: REDUCER_STATUS.IDLE,
  totalCount: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MENU_NOTIFICATIONS:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case FETCH_MENU_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        notifications: action.notifications,
        totalCount: action.totalCount
      };
    case FETCH_MENU_NOTIFICATIONS_FAILURE:
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
