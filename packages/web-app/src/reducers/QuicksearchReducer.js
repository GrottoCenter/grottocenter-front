import {
  RESET_QUICKSEARCH,
  FETCH_QUICKSEARCH_SUCCESS,
  FETCH_QUICKSEARCH_FAILURE,
  SET_CURRENT_ENTRY,
  FETCH_LOADING
} from '../actions/Quicksearch';

const initialState = {
  results: [],
  error: null,
  isLoading: false,
  entry: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case RESET_QUICKSEARCH:
      return initialState;
    case FETCH_LOADING:
      return {
        ...state,
        isLoading: true
      };
    case FETCH_QUICKSEARCH_SUCCESS:
      return {
        ...state,
        results: action.results,
        isLoading: false
      };
    case FETCH_QUICKSEARCH_FAILURE:
      return {
        ...state,
        error: action.error,
        isLoading: false
      };
    case SET_CURRENT_ENTRY:
      return {
        ...state,
        entry: action.entry,
        isLoading: false
      };
    default:
      return state;
  }
};

export default reducer;
