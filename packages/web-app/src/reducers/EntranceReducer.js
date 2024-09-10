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
import {
  DELETE_ENTRANCE_SUCCESS,
  DELETE_ENTRANCE_PERMANENT_SUCCESS
} from '../actions/Entrance/DeleteEntrance';
import { RESTORE_ENTRANCE_SUCCESS } from '../actions/Entrance/RestoreEntrance';

import { LINK_DOCUMENT_TO_ENTRANCE_SUCCESS } from '../actions/LinkDocumentToEntrance';
import { UNLINK_DOCUMENT_TO_ENTRANCE_SUCCESS } from '../actions/UnlinkDocumentToEntrance';

import { POST_RIGGINGS_SUCCESS } from '../actions/Riggings/CreateRigging';
import { UPDATE_RIGGINGS_SUCCESS } from '../actions/Riggings/UpdateRigging';
import {
  DELETE_RIGGINGS_SUCCESS,
  DELETE_RIGGINGS_PERMANENT_SUCCESS
} from '../actions/Riggings/DeleteRigging';
import { RESTORE_RIGGINGS_SUCCESS } from '../actions/Riggings/RestoreRigging';

import { POST_HISTORY_SUCCESS } from '../actions/History/CreateHistory';
import { UPDATE_HISTORY_SUCCESS } from '../actions/History/UpdateHistory';
import {
  DELETE_HISTORY_SUCCESS,
  DELETE_HISTORY_PERMANENT_SUCCESS
} from '../actions/History/DeleteHistory';
import { RESTORE_HISTORY_SUCCESS } from '../actions/History/RestoreHistory';

import { POST_LOCATION_SUCCESS } from '../actions/Location/CreateLocation';
import { UPDATE_LOCATION_SUCCESS } from '../actions/Location/UpdateLocation';
import {
  DELETE_LOCATION_SUCCESS,
  DELETE_LOCATION_PERMANENT_SUCCESS
} from '../actions/Location/DeleteLocation';
import { RESTORE_LOCATION_SUCCESS } from '../actions/Location/RestoreLocation';

import { POST_COMMENT_SUCCESS } from '../actions/Comment/CreateComment';
import { UPDATE_COMMENT_SUCCESS } from '../actions/Comment/UpdateComment';
import {
  DELETE_COMMENT_SUCCESS,
  DELETE_COMMENT_PERMANENT_SUCCESS
} from '../actions/Comment/DeleteComment';
import { RESTORE_COMMENT_SUCCESS } from '../actions/Comment/RestoreComment';

import { POST_DESCRIPTION_SUCCESS } from '../actions/Description/CreateDescription';
import { UPDATE_DESCRIPTION_SUCCESS } from '../actions/Description/UpdateDescription';
import {
  DELETE_DESCRIPTION_SUCCESS,
  DELETE_DESCRIPTION_PERMANENT_SUCCESS
} from '../actions/Description/DeleteDescription';
import { RESTORE_DESCRIPTION_SUCCESS } from '../actions/Description/RestoreDescription';

const initialState = {
  data: undefined,
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
    case DELETE_ENTRANCE_SUCCESS:
    case DELETE_ENTRANCE_PERMANENT_SUCCESS:
    case RESTORE_ENTRANCE_SUCCESS:
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
    case DELETE_LOCATION_SUCCESS:
    case RESTORE_LOCATION_SUCCESS:
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
    case DELETE_LOCATION_PERMANENT_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          locations: state.data.locations.filter(
            e => e.id !== action.location.id
          )
        }
      };
    case POST_HISTORY_SUCCESS:
    case UPDATE_HISTORY_SUCCESS:
    case DELETE_HISTORY_SUCCESS:
    case RESTORE_HISTORY_SUCCESS:
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
    case DELETE_HISTORY_PERMANENT_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          histories: state.data.histories.filter(
            e => e.id !== action.history.id
          )
        }
      };
    case POST_DESCRIPTION_SUCCESS:
    case UPDATE_DESCRIPTION_SUCCESS:
    case DELETE_DESCRIPTION_SUCCESS:
    case RESTORE_DESCRIPTION_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          descriptions: arrFindReplaceOrAdd(
            state.data?.descriptions ?? [],
            e => e.id === action.description.id,
            action.description
          )
        }
      };
    case DELETE_DESCRIPTION_PERMANENT_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          descriptions: state.data.descriptions?.filter(
            e => e.id !== action.description.id
          )
        }
      };
    case POST_RIGGINGS_SUCCESS:
    case UPDATE_RIGGINGS_SUCCESS:
    case DELETE_RIGGINGS_SUCCESS:
    case RESTORE_RIGGINGS_SUCCESS:
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
    case DELETE_RIGGINGS_PERMANENT_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          riggings: state.data.riggings.filter(e => e.id !== action.rigging.id)
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
    case DELETE_COMMENT_SUCCESS:
    case RESTORE_COMMENT_SUCCESS:
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
    case DELETE_COMMENT_PERMANENT_SUCCESS:
      return {
        ...initialState,
        data: {
          ...state.data,
          comments: state.data.comments.filter(e => e.id !== action.comment.id)
        }
      };
    default:
      return state;
  }
};

export default reducer;
