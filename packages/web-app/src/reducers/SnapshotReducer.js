import {
  FETCH_SNAPSHOT_SUCCESS,
  FETCH_SNAPSHOT_ERROR,
  FETCH_SNAPSHOT_LOADING
} from '../actions/Snapshot/GetSnapshots';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  data: {},
  error: undefined,
  status: REDUCER_STATUS.IDLE,
  latestHttpCode: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_SNAPSHOT_LOADING:
      return {
        ...state,
        status: REDUCER_STATUS.LOADING
      };
    case FETCH_SNAPSHOT_SUCCESS:
      return {
        ...state,
        data: action.data,
        status: REDUCER_STATUS.SUCCEEDED
      };
    case FETCH_SNAPSHOT_ERROR:
      return {
        ...state,
        error: action.error,
        status: REDUCER_STATUS.FAILED,
        latestHttpCode: action.httpCode
      };
    default:
      return state;
  }
};

export default reducer;
