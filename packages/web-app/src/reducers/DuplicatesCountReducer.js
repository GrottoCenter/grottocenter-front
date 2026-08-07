import {
  FETCH_DUPLICATES_COUNT,
  FETCH_DUPLICATES_COUNT_FAILURE,
  FETCH_DUPLICATES_COUNT_SUCCESS
} from '../actions/DuplicatesCount';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  value: 0,
  status: REDUCER_STATUS.IDLE,
  error: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DUPLICATES_COUNT:
      return {
        ...state,
        status: REDUCER_STATUS.LOADING,
        error: undefined
      };
    case FETCH_DUPLICATES_COUNT_SUCCESS:
      return {
        ...state,
        value: action.value,
        status: REDUCER_STATUS.SUCCEEDED,
        error: undefined
      };
    case FETCH_DUPLICATES_COUNT_FAILURE:
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
