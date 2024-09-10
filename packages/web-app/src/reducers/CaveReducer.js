import arrFindReplaceOrAdd from './utils';
import {
  FETCH_CAVE_SUCCESS,
  FETCH_CAVE_ERROR,
  FETCH_CAVE_LOADING
} from '../actions/Cave/GetCave';
import {
  DELETE_CAVE_SUCCESS,
  DELETE_CAVE_PERMANENT_SUCCESS
} from '../actions/Cave/DeleteCave';
import { RESTORE_CAVE_SUCCESS } from '../actions/Cave/RestoreCave';
import { POST_DESCRIPTION_SUCCESS } from '../actions/Description/CreateDescription';
import { UPDATE_DESCRIPTION_SUCCESS } from '../actions/Description/UpdateDescription';
import {
  DELETE_DESCRIPTION_SUCCESS,
  DELETE_DESCRIPTION_PERMANENT_SUCCESS
} from '../actions/Description/DeleteDescription';
import { RESTORE_DESCRIPTION_SUCCESS } from '../actions/Description/RestoreDescription';

const initialState = {
  cave: undefined,
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
    case DELETE_CAVE_SUCCESS:
    case DELETE_CAVE_PERMANENT_SUCCESS:
    case RESTORE_CAVE_SUCCESS:
      return {
        ...initialState,
        cave: action.cave
      };
    case FETCH_CAVE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error
      };

    case POST_DESCRIPTION_SUCCESS:
    case UPDATE_DESCRIPTION_SUCCESS:
    case DELETE_DESCRIPTION_SUCCESS:
    case RESTORE_DESCRIPTION_SUCCESS:
      return {
        ...initialState,
        cave: {
          ...state.cave,
          descriptions: arrFindReplaceOrAdd(
            state.cave?.descriptions ?? [],
            e => e.id === action.description.id,
            action.description
          )
        }
      };
    case DELETE_DESCRIPTION_PERMANENT_SUCCESS:
      return {
        ...initialState,
        cave: {
          ...state.cave,
          descriptions: state.cave.descriptions?.filter(
            e => e.id !== action.description.id
          )
        }
      };
    default:
      return state;
  }
};

export default reducer;
