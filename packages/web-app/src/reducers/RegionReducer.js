import {
  REGIONS_SEARCH,
  REGIONS_SEARCH_FAILURE,
  REGIONS_SEARCH_SUCCESS,
  RESET_REGIONS_SEARCH
} from '../actions/Region';

const initialState = {
  results: [],
  isFetching: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case REGIONS_SEARCH:
      return { ...state, isFetching: true };

    case REGIONS_SEARCH_SUCCESS:
      return {
        ...state,
        results: action.results,
        isFetching: false
      };

    case REGIONS_SEARCH_FAILURE:
      return { ...state, error: action.error, isFetching: false };

    case RESET_REGIONS_SEARCH:
      return { ...state, results: [] };

    default:
      return state;
  }
};

export default reducer;
