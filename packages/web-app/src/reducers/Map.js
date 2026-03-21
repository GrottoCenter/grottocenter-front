import { lensProp, set } from 'ramda';
import {
  FETCH_MAP_ENTRANCES_COORDINATES_FAILURE,
  FETCH_MAP_ENTRANCES_COORDINATES_SUCCESS,
  FETCH_MAP_ENTRANCES_FAILURE,
  FETCH_MAP_ENTRANCES_SUCCESS,
  FETCH_MAP_NETWORKS_COORDINATES_FAILURE,
  FETCH_MAP_NETWORKS_COORDINATES_SUCCESS,
  FETCH_MAP_NETWORKS_FAILURE,
  FETCH_MAP_NETWORKS_SUCCESS,
  FETCH_MAP_ORGANIZATIONS_FAILURE,
  FETCH_MAP_ORGANIZATIONS_SUCCESS,
  FETCH_MAP_MASSIFS_FAILURE,
  FETCH_MAP_MASSIFS_SUCCESS,
  FETCH_MAP_MASSIFS_COORDINATES_FAILURE,
  FETCH_MAP_MASSIFS_COORDINATES_SUCCESS,
  FETCH_MAP_START_LOADING,
  FETCH_MAP_END_LOADING,
  LOADINGS
} from '../actions/Map';

const initialState = {
  networksCoordinates: [],
  networks: [],
  entrancesCoordinates: [],
  entrances: [],
  organizations: [],
  massifsCoordinates: [],
  massifs: [],
  error: undefined,
  loadings: {
    [LOADINGS.NETWORKS]: false,
    [LOADINGS.NETWORKS_COORDINATES]: false,
    [LOADINGS.ENTRANCES]: false,
    [LOADINGS.ENTRANCES_COORDINATES]: false,
    [LOADINGS.ORGANIZATIONS]: false,
    [LOADINGS.MASSIFS]: false,
    [LOADINGS.MASSIFS_COORDINATES]: false
  }
};

const reducer = (state = initialState, action) => {
  const makeLoadings = (isLoading, key) =>
    set(lensProp(key), isLoading, state.loadings);

  switch (action.type) {
    case FETCH_MAP_START_LOADING:
      return {
        ...state,
        loadings: makeLoadings(true, action.key)
      };
    case FETCH_MAP_END_LOADING:
      return {
        ...state,
        loadings: makeLoadings(false, action.key)
      };
    case FETCH_MAP_ENTRANCES_COORDINATES_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        entrancesCoordinates: action.data
      };
    case FETCH_MAP_ENTRANCES_COORDINATES_FAILURE:
      return {
        ...state,
        error: action.error
      };
    case FETCH_MAP_ENTRANCES_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        entrances: action.data
      };
    case FETCH_MAP_ENTRANCES_FAILURE:
      return { ...state, error: action.error };
    case FETCH_MAP_NETWORKS_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        networks: action.data
      };
    case FETCH_MAP_NETWORKS_FAILURE:
      return { ...state, error: action.error };
    case FETCH_MAP_NETWORKS_COORDINATES_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        networksCoordinates: action.data
      };
    case FETCH_MAP_NETWORKS_COORDINATES_FAILURE:
      return { ...state, error: action.error };
    case FETCH_MAP_ORGANIZATIONS_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        organizations: action.data
      };
    case FETCH_MAP_ORGANIZATIONS_FAILURE:
      return { ...state, error: action.error };
    case FETCH_MAP_MASSIFS_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        massifs: action.data
      };
    case FETCH_MAP_MASSIFS_FAILURE:
      return { ...state, error: action.error };
    case FETCH_MAP_MASSIFS_COORDINATES_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        massifsCoordinates: action.data
      };
    case FETCH_MAP_MASSIFS_COORDINATES_FAILURE:
      return { ...state, error: action.error };
    default:
      return state;
  }
};

export default reducer;
