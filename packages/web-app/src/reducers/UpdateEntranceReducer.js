import {
  UPDATE_ENTRANCE,
  UPDATE_ENTRANCE_ERROR,
  UPDATE_ENTRANCE_SUCCESS
} from '../actions/Entrance/UpdateEntrance';

const initialState = {
  loading: false,
  error: null,
  data: null,
  latestHttpCode: null
};

// latestHttpCode moved here from state.entrance when that slice was retired.
// HydratedEntranceDuplicates reads it to react to a successful update; kept
// as a first-class field so a caller does not have to derive "success" from
// (loading dropped && no error).
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_ENTRANCE:
      return {
        ...state,
        error: initialState.error,
        loading: true,
        latestHttpCode: null
      };
    case UPDATE_ENTRANCE_ERROR:
      return {
        ...state,
        error: action.error,
        loading: false,
        latestHttpCode: action.httpCode
      };
    case UPDATE_ENTRANCE_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        loading: false,
        latestHttpCode: action.httpCode
      };
    default:
      return state;
  }
};

export default reducer;
