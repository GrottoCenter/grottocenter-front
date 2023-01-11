import {
  FETCH_STATISTICS_MASSIF_SUCCESS,
  FETCH_STATISTICS_MASSIF_LOADING,
  FETCH_STATISTICS_MASSIF_ERROR
} from '../actions/Massif/GetStatisticsMassif';

const initialState = {
  dataMassif: {},
  loadingMassif: false,
  errorMassif: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_STATISTICS_MASSIF_LOADING:
      return {
        ...state,
        errorMassif: null,
        loadingMassif: true
      };
    case FETCH_STATISTICS_MASSIF_SUCCESS:
      return {
        ...initialState,
        dataMassif: action.data
      };
    case FETCH_STATISTICS_MASSIF_ERROR:
      return {
        ...state,
        loadingMassif: false,
        errorMassif: action.error
      };
    default:
      return state;
  }
};

export default reducer;
