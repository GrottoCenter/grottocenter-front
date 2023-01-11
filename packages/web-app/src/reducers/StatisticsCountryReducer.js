import {
  FETCH_STATISTICS_COUNTRY_SUCCESS,
  FETCH_STATISTICS_COUNTRY_LOADING,
  FETCH_STATISTICS_COUNTRY_ERROR
} from '../actions/Country/GetStatisticsCountry';

const initialState = {
  dataCountry: {},
  loadingCountry: false,
  errorCountry: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_STATISTICS_COUNTRY_LOADING:
      return {
        ...state,
        errorCountry: null,
        loadingCountry: true
      };
    case FETCH_STATISTICS_COUNTRY_SUCCESS:
      return {
        ...initialState,
        dataCountry: action.data
      };
    case FETCH_STATISTICS_COUNTRY_ERROR:
      return {
        ...state,
        loadingCountry: false,
        errorCountry: action.error
      };
    default:
      return state;
  }
};

export default reducer;
