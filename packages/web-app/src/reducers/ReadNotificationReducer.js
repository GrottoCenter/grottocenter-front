import {
  READ_NOTIFICATION,
  READ_NOTIFICATION_FAILURE,
  READ_NOTIFICATION_SUCCESS
} from '../actions/Notifications/ReadNotification';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case READ_NOTIFICATION:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case READ_NOTIFICATION_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED
      };
    case READ_NOTIFICATION_FAILURE:
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
