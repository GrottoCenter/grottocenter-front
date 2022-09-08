import {
  UNSUBSCRIBE_FROM_MASSIF,
  UNSUBSCRIBE_FROM_MASSIF_FAILURE,
  UNSUBSCRIBE_FROM_MASSIF_SUCCESS
} from '../actions/Subscriptions/UnsubscribeFromMassif';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UNSUBSCRIBE_FROM_MASSIF:
      return {
        ...state,
        status: REDUCER_STATUS.LOADING,
        error: undefined
      };
    case UNSUBSCRIBE_FROM_MASSIF_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        error: undefined
      };
    case UNSUBSCRIBE_FROM_MASSIF_FAILURE:
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
