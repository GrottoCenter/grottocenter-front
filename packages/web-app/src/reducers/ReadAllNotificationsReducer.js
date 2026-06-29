import {
  READ_ALL_NOTIFICATIONS,
  READ_ALL_NOTIFICATIONS_FAILURE,
  READ_ALL_NOTIFICATIONS_SUCCESS
} from '../actions/Notifications/ReadAllNotifications';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case READ_ALL_NOTIFICATIONS:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case READ_ALL_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED
      };
    case READ_ALL_NOTIFICATIONS_FAILURE:
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
