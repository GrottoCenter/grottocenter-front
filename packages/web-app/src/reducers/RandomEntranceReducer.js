import {
  FETCH_RANDOM_ENTRANCE,
  FETCH_RANDOM_ENTRANCE_SUCCESS,
  FETCH_RANDOM_ENTRANCE_FAILURE
} from '../actions/RandomEntrance';

const initialState = {
  isFetching: false, // show loading spinner
  entrance: undefined, // random entry
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_RANDOM_ENTRANCE:
      return { ...initialState, isFetching: true };
    case FETCH_RANDOM_ENTRANCE_SUCCESS:
      return { ...initialState, entrance: action.entrance };
    case FETCH_RANDOM_ENTRANCE_FAILURE:
      return { ...initialState, error: action.error };
    default:
      return state;
  }
};

export default reducer;
