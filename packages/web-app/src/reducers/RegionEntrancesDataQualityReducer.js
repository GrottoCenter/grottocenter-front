import {
  FETCH_REGION_ENTRANCES_DATA_QUALITY_SUCCESS,
  FETCH_REGION_ENTRANCES_DATA_QUALITY_LOADING,
  FETCH_REGION_ENTRANCES_DATA_QUALITY_ERROR
} from '../actions/Region/GetEntrancesDataQuality';

const initialState = {
  regionEntrances: {},
  regionEntrancesLoading: false,
  regionEntrancesError: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_REGION_ENTRANCES_DATA_QUALITY_LOADING:
      return {
        ...state,
        regionEntrancesError: null,
        regionEntrancesLoading: true
      };
    case FETCH_REGION_ENTRANCES_DATA_QUALITY_SUCCESS:
      return {
        ...initialState,
        regionEntrances: action.data.quality
      };
    case FETCH_REGION_ENTRANCES_DATA_QUALITY_ERROR:
      return {
        ...state,
        regionEntrancesLoading: false,
        regionEntrancesError: action.error
      };
    default:
      return state;
  }
};

export default reducer;
