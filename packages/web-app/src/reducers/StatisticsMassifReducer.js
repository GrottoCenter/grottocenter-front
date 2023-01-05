import {
  FETCH_STATISTICS_MASSIF_SUCCESS,
  FETCH_STATISTICS_MASSIF_LOADING,
  FETCH_STATISTICS_MASSIF_ERROR
} from '../actions/Massif/GetStatisticsMassif';

const initialState = {
  data: {},
  loading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_STATISTICS_MASSIF_LOADING:
      return {
        ...state,
        error: null,
        loading: true
      };
    case FETCH_STATISTICS_MASSIF_SUCCESS:
      return {
        ...initialState,
        data: action.data
      };
    case FETCH_STATISTICS_MASSIF_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
