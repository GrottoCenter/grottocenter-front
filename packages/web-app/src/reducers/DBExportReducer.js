import {
  GET_DB_EXPORT,
  GET_DB_EXPORT_FAILURE,
  GET_DB_EXPORT_SUCCESS
} from '../actions/DBExport';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  url: '',
  lastUpdate: '',
  size: '',
  status: REDUCER_STATUS.IDLE
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_DB_EXPORT:
      return {
        ...initialState,
        status: REDUCER_STATUS.LOADING
      };
    case GET_DB_EXPORT_SUCCESS:
      return {
        ...initialState,
        url: action.url,
        size: action.size,
        lastUpdate: action.lastUpdate,
        status: REDUCER_STATUS.SUCCEEDED,
        error: undefined
      };
    case GET_DB_EXPORT_FAILURE:
      return {
        ...initialState,
        status: REDUCER_STATUS.FAILED,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
