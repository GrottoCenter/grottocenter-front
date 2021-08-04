import {
  FETCH_RANDOMENTRY,
  FETCH_RANDOMENTRY_SUCCESS,
  FETCH_RANDOMENTRY_FAILURE
} from '../actions/RandomEntry';

const initialState = {
  isFetching: false, // show loading spinner
  entry: undefined, // random entry
  error: null
};

const randomEntry = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_RANDOMENTRY:
      return { ...initialState, isFetching: true };
    case FETCH_RANDOMENTRY_SUCCESS:
      return { ...initialState, entry: action.entry };
    case FETCH_RANDOMENTRY_FAILURE:
      return { ...initialState, error: action.error };
    default:
      return state;
  }
};

export default randomEntry;
