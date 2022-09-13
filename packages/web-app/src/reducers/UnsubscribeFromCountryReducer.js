import {
  UNSUBSCRIBE_FROM_COUNTRY,
  UNSUBSCRIBE_FROM_COUNTRY_FAILURE,
  UNSUBSCRIBE_FROM_COUNTRY_SUCCESS
} from '../actions/Subscriptions/UnsubscribeFromCountry';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UNSUBSCRIBE_FROM_COUNTRY:
      return {
        ...state,
        status: REDUCER_STATUS.LOADING,
        error: undefined
      };
    case UNSUBSCRIBE_FROM_COUNTRY_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        error: undefined
      };
    case UNSUBSCRIBE_FROM_COUNTRY_FAILURE:
      return {
        ...state,
        status: REDUCER_STATUS.FAILED,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
