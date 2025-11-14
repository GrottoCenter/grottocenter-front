import {
  FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_SUCCESS,
  FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_LOADING,
  FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_ERROR
} from '../actions/Country/GetEntrancesDataQuality';

const initialState = {
  countryEntrances: {},
  countryEntrancesLoading: false,
  countryEntrancesError: null,
  totalCount: 0,
  totalPages: 0
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_LOADING:
      return {
        ...state,
        countryEntrancesError: null,
        countryEntrancesLoading: true
      };
    case FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_SUCCESS:
      return {
        ...initialState,
        countryEntrances: action.data.quality,
        totalCount: action.data.totalCount || 0,
        totalPages: action.data.totalPages || 0
      };
    case FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_ERROR:
      return {
        ...state,
        countryEntrancesLoading: false,
        countryEntrancesError: action.error
      };
    default:
      return state;
  }
};

export default reducer;
