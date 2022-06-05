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
import { POST_HISTORY_SUCCESS } from '../actions/CreateHistory';
import { UPDATE_HISTORY_SUCCESS } from '../actions/UpdateHistory';
import { POST_DESCRIPTION_SUCCESS } from '../actions/CreateDescription';
import { UPDATE_DESCRIPTION_SUCCESS } from '../actions/UpdateDescription';

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
    case POST_HISTORY_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          histories: [...state.data.histories, action.history]
        }
      };
    case UPDATE_HISTORY_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          histories: [
            ...state.data.histories.filter(l => l.id !== action.history.id),
            { ...action.history, entrance: action.history.entrance.id }
          ]
        }
      };
    case POST_DESCRIPTION_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          descriptions: [...state.data.descriptions, action.description]
        }
      };
    case UPDATE_DESCRIPTION_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          descriptions: [
            ...state.data.descriptions.filter(
              l => l.id !== action.description.id
            ),
            { ...action.description }
          ]
        }
      };
    default:
      return state;
  }
};

export default reducer;
