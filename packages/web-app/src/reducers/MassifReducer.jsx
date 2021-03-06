import {
  FETCH_MASSIF,
  FETCH_MASSIF_FAILURE,
  FETCH_MASSIF_SUCCESS
} from '../actions/Massif';

const initialState = {
  massif: undefined, // massif fetched
  isFetching: false, // show loading spinner
  error: null // fetch errors
};

const massif = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MASSIF:
      return { ...state, massif: action.massif, isFetching: true };
    case FETCH_MASSIF_SUCCESS:
      return { ...state, massif: action.massif, isFetching: false };
    case FETCH_MASSIF_FAILURE:
      return { ...state, error: action.error, isFetching: false };
    default:
      return state;
  }
};

export default massif;
