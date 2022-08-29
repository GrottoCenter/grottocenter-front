import {
  FETCH_MASSIF,
  FETCH_MASSIF_FAILURE,
  FETCH_MASSIF_SUCCESS
} from '../actions/Massif/GetMassif';

const initialState = {
  massif: undefined,
  isFetching: false,
  error: null
};

const reducer = (state = initialState, action) => {
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

export default reducer;
