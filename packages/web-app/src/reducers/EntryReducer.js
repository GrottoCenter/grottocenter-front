import {
  LOAD_ENTRY_SUCCESS,
  LOAD_ENTRY_ERROR,
  LOAD_ENTRY_LOADING,
  UPDATE_ENTRY_SUCCESS,
  UPDATE_ENTRY_LOADING,
  UPDATE_ENTRY_ERROR,
  CREATE_ENTRY_LOADING,
  CREATE_ENTRY_SUCCESS,
  CREATE_ENTRY_ERROR,
  RESET_ENTRY_STATE
} from '../actions/Entry';

import { POST_LOCATION_SUCCESS } from '../actions/CreateLocation';

// remove once api give the information
const today = new Date();

const initialState = {
  data: {
    id: 1,
    name: 'Name',
    country: 'Country',
    region: 'Region',
    city: 'City',
    latitude: null,
    locations: [],
    longitude: null,
    cave: {
      dateInscription: today.toISOString().substring(0, 10)
    },
    massif: {}
  },
  loading: false,
  error: null,
  latestHttpCode: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_ENTRY_LOADING:
    case UPDATE_ENTRY_LOADING:
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
    case UPDATE_ENTRY_SUCCESS:
    case CREATE_ENTRY_SUCCESS:
      return {
        ...state,
        loading: false,
        latestHttpCode: action.httpCode
      };
    case UPDATE_ENTRY_ERROR:
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
    default:
      return state;
  }
};

export default reducer;
