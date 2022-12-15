import {
  FETCH_CAVE_SUCCESS,
  FETCH_CAVE_ERROR,
  FETCH_CAVE_LOADING
} from '../actions/Cave/GetCave';

import { POST_DESCRIPTION_SUCCESS } from '../actions/Description/CreateDescription';
import { UPDATE_DESCRIPTION_SUCCESS } from '../actions/Description/UpdateDescription';
import arrFindReplaceOrAdd from './utils';

const initialState = {
  data: {},
  loading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_CAVE_LOADING:
      return {
        ...state,
        error: null,
        loading: true
      };
    case FETCH_CAVE_SUCCESS:
      return {
        ...initialState,
        data: action.data
      };
    case FETCH_CAVE_ERROR:
      return {
        ...state,
        loading: true,
        error: action.error
      };

    case POST_DESCRIPTION_SUCCESS:
    case UPDATE_DESCRIPTION_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          descriptions: arrFindReplaceOrAdd(
            state.data.descriptions,
            e => e.id === action.description.id,
            action.description
          )
        }
      };
    default:
      return state;
  }
};

export default reducer;
