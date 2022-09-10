import {
  FETCH_COUNTRY,
  FETCH_COUNTRY_FAILURE,
  FETCH_COUNTRY_SUCCESS
} from '../actions/Country/GetCountry';

import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE,
  country: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_COUNTRY:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case FETCH_COUNTRY_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        country: action.country
      };
    case FETCH_COUNTRY_FAILURE:
      return {
        ...state,
        error: action.error,
        status: REDUCER_STATUS.FAILED
      };

    default:
      return state;
  }
};

export default reducer;
