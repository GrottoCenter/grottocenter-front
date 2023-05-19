import {
  FETCH_RECENT_CHANGES,
  FETCH_RECENT_CHANGES_SUCCESS,
  FETCH_RECENT_CHANGES_FAILURE
} from '../actions/RecentChanges';

const initialState = {
  isFetching: false,
  changes: undefined,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_RECENT_CHANGES:
      return { ...initialState, isFetching: true };
    case FETCH_RECENT_CHANGES_SUCCESS:
      return { ...initialState, changes: action.changes };
    case FETCH_RECENT_CHANGES_FAILURE:
      return { ...initialState, error: action.error };
    default:
      return state;
  }
};

export default reducer;
