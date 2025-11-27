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
import {
  LINK_CAVE,
  LINK_CAVE_SUCCESS,
  LINK_CAVE_FAILURE
} from '../actions/Cave/LinkCave';
import {
  UNLINK_CAVE,
  UNLINK_CAVE_SUCCESS,
  UNLINK_CAVE_FAILURE
} from '../actions/Cave/UnlinkCave';

const initialState = {
  organization: undefined,
  isLoading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ORGANIZATION:
    case LINK_CAVE:
    case UNLINK_CAVE:
      return {
        ...state,
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
    case LINK_CAVE_FAILURE:
    case UNLINK_CAVE_FAILURE:
      return {
        ...state,
        error: action.error,
        isLoading: false
      };
    case LINK_CAVE_SUCCESS:
    case UNLINK_CAVE_SUCCESS:
      return {
        ...state,
        isLoading: false
      };
    default:
      return state;
  }
};

export default reducer;
