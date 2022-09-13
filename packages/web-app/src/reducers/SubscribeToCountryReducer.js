import {
  SUBSCRIBE_TO_COUNTRY,
  SUBSCRIBE_TO_COUNTRY_FAILURE,
  SUBSCRIBE_TO_COUNTRY_SUCCESS
} from '../actions/Subscriptions/SubscribeToCountry';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  errorMessages: [],
  status: REDUCER_STATUS.IDLE
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SUBSCRIBE_TO_COUNTRY:
      return {
        ...state,
        status: REDUCER_STATUS.LOADING,
        errorMessages: []
      };
    case SUBSCRIBE_TO_COUNTRY_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        errorMessages: []
      };
    case SUBSCRIBE_TO_COUNTRY_FAILURE:
      return {
        ...state,
        status: REDUCER_STATUS.FAILED,
        errorMessages: action.errorMessages
      };
    default:
      return state;
  }
};

export default reducer;
