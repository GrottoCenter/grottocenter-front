import {
  FETCH_CUMULATED_LENGTH_SUCCESS,
  FETCH_CUMULATED_LENGTH_LOADING,
  FETCH_CUMULATED_LENGTH_ERROR
} from '../actions/CumulatedLength';

const initialState = {
  cumulatedLength: {},
  error: null,
  loadingCumulatedLength: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_CUMULATED_LENGTH_LOADING:
      return {
        ...state,
        error: null,
        loadingCumulatedLength: true
      };
    case FETCH_CUMULATED_LENGTH_SUCCESS:
      return {
        ...initialState,
        cumulatedLength: action.data
      };
    case FETCH_CUMULATED_LENGTH_ERROR:
      return {
        ...state,
        loadingCumulatedLength: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
