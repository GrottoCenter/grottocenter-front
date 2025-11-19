import {
  FETCH_ADVANCEDSEARCH,
  FETCH_ADVANCEDSEARCH_SUCCESS,
  FETCH_ADVANCEDSEARCH_FAILURE,
  RESET_ADVANCEDSEARCH_RESULTS
} from '../actions/Advancedsearch';

const initialState = {
  isNewQuery: false,
  queryParams: undefined,
  totalResults: 0,
  results: undefined,
  errors: undefined,
  isLoading: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ADVANCEDSEARCH: {
      return {
        ...state,
        errors: undefined,
        isLoading: true,
        queryParams: action.queryParams,
        isNewQuery: action.isNewQuery
      };
    }
    case FETCH_ADVANCEDSEARCH_SUCCESS: {
      return {
        ...initialState,
        queryParams: state.queryParams,
        totalResults: action.totalResults,
        results: action.results
      };
    }
    case FETCH_ADVANCEDSEARCH_FAILURE: {
      return { ...initialState, error: action.error };
    }
    case RESET_ADVANCEDSEARCH_RESULTS: {
      return initialState;
    }
    default:
      return state;
  }
};

export default reducer;
