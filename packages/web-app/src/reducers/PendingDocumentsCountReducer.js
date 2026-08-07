import {
  FETCH_PENDING_DOCUMENTS_COUNT,
  FETCH_PENDING_DOCUMENTS_COUNT_FAILURE,
  FETCH_PENDING_DOCUMENTS_COUNT_SUCCESS
} from '../actions/PendingDocumentsCount';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  value: 0,
  status: REDUCER_STATUS.IDLE,
  error: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PENDING_DOCUMENTS_COUNT:
      return {
        ...state,
        status: REDUCER_STATUS.LOADING,
        error: undefined
      };
    case FETCH_PENDING_DOCUMENTS_COUNT_SUCCESS:
      return {
        ...state,
        value: action.value,
        status: REDUCER_STATUS.SUCCEEDED,
        error: undefined
      };
    case FETCH_PENDING_DOCUMENTS_COUNT_FAILURE:
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
