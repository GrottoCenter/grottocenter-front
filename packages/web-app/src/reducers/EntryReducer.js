import {
  LOAD_ENTRY_SUCCESS,
  LOAD_ENTRY_ERROR,
  LOAD_ENTRY_LOADING,
  UPDATE_ENTRANCE_SUCCESS,
  UPDATE_ENTRANCE,
  UPDATE_ENTRANCE_ERROR,
  CREATE_ENTRY_LOADING,
  CREATE_ENTRY_SUCCESS,
  CREATE_ENTRY_ERROR,
  RESET_ENTRY_STATE
} from '../actions/Entry';

import { POST_LOCATION_SUCCESS } from '../actions/CreateLocation';
import { UPDATE_LOCATION_SUCCESS } from '../actions/UpdateLocation';

const initialState = {
  data: {},
  loading: false,
  error: null,
  latestHttpCode: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_ENTRY_LOADING:
    case UPDATE_ENTRANCE:
    case CREATE_ENTRY_LOADING:
      return {
        ...state,
        error: null,
        loading: true,
        latestHttpCode: null
      };
    case LOAD_ENTRY_SUCCESS:
      return {
        ...initialState,
        data: action.data
      };
    case LOAD_ENTRY_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error
      };
    case UPDATE_ENTRANCE_SUCCESS:
    case CREATE_ENTRY_SUCCESS:
      return {
        ...state,
        loading: false,
        latestHttpCode: action.httpCode
      };
    case UPDATE_ENTRANCE_ERROR:
    case CREATE_ENTRY_ERROR:
      return {
        ...state,
        loading: false,
        latestHttpCode: action.httpCode,
        error: action.error
      };
    case RESET_ENTRY_STATE:
      return initialState;
    case POST_LOCATION_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          locations: [...state.data.locations, action.location]
        }
      };

    case UPDATE_LOCATION_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          locations: [
            ...state.data.locations.filter(l => l.id !== action.location.id),
            { ...action.location, entrance: action.location.entrance.id }
          ]
        }
      };
    default:
      return state;
  }
};

export default reducer;
