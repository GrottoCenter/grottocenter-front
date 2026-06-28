import {
  SET_COUNTRY_ORGANIZATION,
  SET_COUNTRY_ORGANIZATION_SUCCESS,
  SET_COUNTRY_ORGANIZATION_FAILURE,
  REMOVE_COUNTRY_ORGANIZATION,
  REMOVE_COUNTRY_ORGANIZATION_SUCCESS,
  REMOVE_COUNTRY_ORGANIZATION_FAILURE
} from '../actions/Country/countryOrganization';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  status: REDUCER_STATUS.IDLE,
  error: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_COUNTRY_ORGANIZATION:
    case REMOVE_COUNTRY_ORGANIZATION:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case SET_COUNTRY_ORGANIZATION_SUCCESS:
    case REMOVE_COUNTRY_ORGANIZATION_SUCCESS:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.SUCCEEDED
      };
    case SET_COUNTRY_ORGANIZATION_FAILURE:
    case REMOVE_COUNTRY_ORGANIZATION_FAILURE:
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
