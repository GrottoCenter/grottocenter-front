import {
  FETCH_COUNTRY_REGIONS,
  FETCH_COUNTRY_REGIONS_SUCCESS,
  FETCH_COUNTRY_REGIONS_FAILURE,
  SET_CACHED_COUNTRY_REGIONS
} from '../actions/Country/GetCountryRegions';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  regions: [],
  status: REDUCER_STATUS.IDLE,
  error: null,
  hasMore: false,
  totalCount: 0
};

const countryRegionsReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_COUNTRY_REGIONS:
      return {
        ...state,
        status: REDUCER_STATUS.LOADING,
        error: null
      };

    case FETCH_COUNTRY_REGIONS_SUCCESS:
      return {
        ...state,
        regions: action.regions,
        status: REDUCER_STATUS.SUCCEEDED,
        error: null,
        hasMore: action.hasMore,
        totalCount: action.totalCount
      };

    case FETCH_COUNTRY_REGIONS_FAILURE:
      return {
        ...state,
        regions: [],
        status: REDUCER_STATUS.FAILED,
        error: action.error
      };

    case SET_CACHED_COUNTRY_REGIONS:
      return {
        ...state,
        regions: action.regions,
        status: REDUCER_STATUS.SUCCEEDED,
        error: null,
        hasMore: action.hasMore,
        totalCount: action.totalCount
      };

    default:
      return state;
  }
};

export default countryRegionsReducer;
