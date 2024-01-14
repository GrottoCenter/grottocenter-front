import arrFindReplaceOrAdd from './utils';
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
import { POST_RIGGINGS_SUCCESS } from '../actions/Riggings/CreateRigging';
import { UPDATE_RIGGINGS_SUCCESS } from '../actions/Riggings/UpdateRigging';
import { POST_COMMENT_SUCCESS } from '../actions/Comment/CreateComment';
import { UPDATE_COMMENT_SUCCESS } from '../actions/Comment/UpdateComment';
import { LINK_DOCUMENT_TO_ENTRANCE_SUCCESS } from '../actions/LinkDocumentToEntrance';
import { UNLINK_DOCUMENT_TO_ENTRANCE_SUCCESS } from '../actions/UnlinkDocumentToEntrance';

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
    case UPDATE_LOCATION_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          locations: arrFindReplaceOrAdd(
            state.data.locations,
            e => e.id === action.location.id,
            action.location
          )
        }
      };
    case POST_HISTORY_SUCCESS:
    case UPDATE_HISTORY_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          histories: arrFindReplaceOrAdd(
            state.data.histories,
            e => e.id === action.history.id,
            action.history
          )
        }
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
    case POST_RIGGINGS_SUCCESS:
    case UPDATE_RIGGINGS_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          riggings: arrFindReplaceOrAdd(
            state.data.riggings,
            e => e.id === action.rigging.id,
            action.rigging
          )
        }
      };
    case LINK_DOCUMENT_TO_ENTRANCE_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          documents: arrFindReplaceOrAdd(
            state.data.documents,
            e => e.id === action.document.id,
            action.document
          )
        }
      };
    case UNLINK_DOCUMENT_TO_ENTRANCE_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          documents: [
            ...state.data.documents.filter(e => e.id !== action.documentId)
          ]
        }
      };
    case POST_COMMENT_SUCCESS:
    case UPDATE_COMMENT_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          comments: arrFindReplaceOrAdd(
            state.data.comments,
            e => e.id === action.comment.id,
            action.comment
          )
        }
      };
    default:
      return state;
  }
};

export default reducer;
