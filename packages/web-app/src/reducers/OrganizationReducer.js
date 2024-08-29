import {
  FETCH_ORGANIZATION,
  FETCH_ORGANIZATION_FAILURE,
  FETCH_ORGANIZATION_SUCCESS
} from '../actions/Organization/GetOrganization';
import {
  DELETE_ORGANIZATION_SUCCESS,
  DELETE_ORGANIZATION_PERMANENT_SUCCESS
} from '../actions/Organization/DeleteOrganization';
import { RESTORE_ORGANIZATION_SUCCESS } from '../actions/Organization/RestoreOrganization';

const initialState = {
  organization: undefined,
  isLoading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ORGANIZATION:
      return {
        ...initialState,
        isLoading: true
      };
    case FETCH_ORGANIZATION_SUCCESS:
    case DELETE_ORGANIZATION_SUCCESS:
    case DELETE_ORGANIZATION_PERMANENT_SUCCESS:
    case RESTORE_ORGANIZATION_SUCCESS:
      return {
        ...initialState,
        error: null,
        isLoading: false,
        organization: action.organization
      };
    case FETCH_ORGANIZATION_FAILURE:
      return {
        ...initialState,
        error: action.error,
        isLoading: false
      };
    default:
      return state;
  }
};

export default reducer;
