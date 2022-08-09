import {
  FETCH_ENTRANCE_SUCCESS,
  FETCH_ENTRANCE_ERROR,
  FETCH_ENTRANCE_LOADING
} from '../actions/Entrance/GetEntrance';
import {
  UPDATE_ENTRANCE_SUCCESS,
  UPDATE_ENTRANCE,
  UPDATE_ENTRANCE_ERROR
} from '../actions/Entrance/UpdateEntrance';
import { RESET_ENTRANCE_STATE } from '../actions/Entrance/ResetEntrance';
import {
  CREATE_ENTRANCE_LOADING,
  CREATE_ENTRANCE_SUCCESS,
  CREATE_ENTRANCE_ERROR
} from '../actions/Entrance/CreateEntrance';

import { POST_LOCATION_SUCCESS } from '../actions/Location/CreateLocation';
import { UPDATE_LOCATION_SUCCESS } from '../actions/Location/UpdateLocation';
import { POST_HISTORY_SUCCESS } from '../actions/History/CreateHistory';
import { UPDATE_HISTORY_SUCCESS } from '../actions/History/UpdateHistory';
import { POST_DESCRIPTION_SUCCESS } from '../actions/Description/CreateDescription';
import { UPDATE_DESCRIPTION_SUCCESS } from '../actions/Description/UpdateDescription';

const initialState = {
  data: {},
  loading: false,
  error: null,
  latestHttpCode: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ENTRANCE_LOADING:
    case UPDATE_ENTRANCE:
    case CREATE_ENTRANCE_LOADING:
      return {
        ...state,
        error: null,
        loading: true,
        latestHttpCode: null
      };
    case FETCH_ENTRANCE_SUCCESS:
      return {
        ...initialState,
        data: action.data
      };
    case FETCH_ENTRANCE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error
      };
    case UPDATE_ENTRANCE_SUCCESS:
    case CREATE_ENTRANCE_SUCCESS:
      return {
        ...state,
        loading: false,
        latestHttpCode: action.httpCode
      };
    case UPDATE_ENTRANCE_ERROR:
    case CREATE_ENTRANCE_ERROR:
      return {
        ...state,
        loading: false,
        latestHttpCode: action.httpCode,
        error: action.error
      };
    case RESET_ENTRANCE_STATE:
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
