import {
  FETCH_PARTNERS_FC,
  FETCH_PARTNERS_FC_SUCCESS,
  FETCH_PARTNERS_FC_FAILURE
} from '../actions/PartnersForCarousel';

const initialState = {
  error: null,
  isFetching: false, // show loading spinner
  partners: undefined // partners list
};

const partnersCarousel = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PARTNERS_FC:
      return { ...state, isFetching: true };
    case FETCH_PARTNERS_FC_SUCCESS:
      return { ...state, isFetching: false, partners: action.entry };
    case FETCH_PARTNERS_FC_FAILURE:
      return { ...state, isFetching: false, error: action.error };
    default:
      return state;
  }
};

export default partnersCarousel;
