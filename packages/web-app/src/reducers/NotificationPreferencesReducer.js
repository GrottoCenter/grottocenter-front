import REDUCER_STATUS from './ReducerStatus';
import {
  GET_NOTIFICATION_PREFERENCES,
  GET_NOTIFICATION_PREFERENCES_SUCCESS,
  GET_NOTIFICATION_PREFERENCES_FAILURE
} from '../actions/Person/GetNotificationPreferences';
import {
  UPDATE_NOTIFICATION_PREFERENCES,
  UPDATE_NOTIFICATION_PREFERENCES_SUCCESS,
  UPDATE_NOTIFICATION_PREFERENCES_FAILURE
} from '../actions/Person/UpdateNotificationPreferences';

const initialState = {
  preferences: null,
  status: REDUCER_STATUS.IDLE,
  error: null,
  updateStatus: REDUCER_STATUS.IDLE,
  updateError: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_NOTIFICATION_PREFERENCES:
      return {
        ...state,
        status: REDUCER_STATUS.LOADING,
        error: null
      };
    case GET_NOTIFICATION_PREFERENCES_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        preferences: action.preferences,
        error: null
      };
    case GET_NOTIFICATION_PREFERENCES_FAILURE:
      return {
        ...state,
        status: REDUCER_STATUS.FAILED,
        error: action.error
      };
    case UPDATE_NOTIFICATION_PREFERENCES:
      return {
        ...state,
        updateStatus: REDUCER_STATUS.LOADING,
        updateError: null
      };
    case UPDATE_NOTIFICATION_PREFERENCES_SUCCESS:
      return {
        ...state,
        updateStatus: REDUCER_STATUS.SUCCEEDED,
        preferences: {
          ...state.preferences,
          ...action.preferences
        },
        updateError: null
      };
    case UPDATE_NOTIFICATION_PREFERENCES_FAILURE:
      return {
        ...state,
        updateStatus: REDUCER_STATUS.FAILED,
        updateError: action.error
      };
    default:
      return state;
  }
};

export default reducer;
