import {
  FETCH_REGION_ENTRANCES_DATA_QUALITY_SUCCESS,
  FETCH_REGION_ENTRANCES_DATA_QUALITY_LOADING,
  FETCH_REGION_ENTRANCES_DATA_QUALITY_ERROR
} from '../actions/Region/GetEntrancesDataQuality';

const initialState = {
  regionEntrances: {},
  regionEntrancesLoading: false,
  regionEntrancesError: null,
  totalCount: 0,
  totalPages: 0
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
        regionEntrances: action.data.quality,
        totalCount: action.data.totalCount || 0,
        totalPages: action.data.totalPages || 0
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
