import {
  SET_MASSIF_ORGANIZATION,
  SET_MASSIF_ORGANIZATION_SUCCESS,
  SET_MASSIF_ORGANIZATION_FAILURE,
  REMOVE_MASSIF_ORGANIZATION,
  REMOVE_MASSIF_ORGANIZATION_SUCCESS,
  REMOVE_MASSIF_ORGANIZATION_FAILURE,
  RESET_MASSIF_ORGANIZATION
} from '../actions/Massif/MassifOrganization';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  status: REDUCER_STATUS.IDLE,
  error: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_MASSIF_ORGANIZATION:
    case REMOVE_MASSIF_ORGANIZATION:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case SET_MASSIF_ORGANIZATION_SUCCESS:
    case REMOVE_MASSIF_ORGANIZATION_SUCCESS:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.SUCCEEDED
      };
    case SET_MASSIF_ORGANIZATION_FAILURE:
    case REMOVE_MASSIF_ORGANIZATION_FAILURE:
      return {
        ...state,
        error: action.error,
        status: REDUCER_STATUS.FAILED
      };
    case RESET_MASSIF_ORGANIZATION:
      return initialState;
    default:
      return state;
  }
};

export default reducer;
