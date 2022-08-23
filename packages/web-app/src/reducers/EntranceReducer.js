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

const initialState = {
  data: {},
  loading: false,
  error: null,
  latestHttpCode: null
};

function transformRiggings(data) {
  const obstacles = data.obstacles.split('|;|');
  const ropes = data.ropes.split('|;|');
  const anchors = data.anchors.split('|;|');
  const observations = data.observations.split('|;|');
  const rigging = {
    id: data.id,
    language: data.language,
    title: data.title,
    obstacles: []
  };

  for (let j = 0; j < obstacles.length; j += 1) {
    rigging.obstacles.push({
      obstacle: obstacles[j],
      observation: observations[j],
      rope: ropes[j],
      anchor: anchors[j]
    });
  }

  return rigging;
}

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
      if (
        action.location?.entrance?.id &&
        action.location?.entrance?.id === state.data?.id
      ) {
        return {
          ...initialState,
          data: {
            ...state.data,
            locations: [...state.data.locations, action.location]
          }
        };
      }
      return initialState;
    case UPDATE_LOCATION_SUCCESS:
      if (
        action.location?.entrance?.id &&
        action.location?.entrance?.id === state.data?.id
      ) {
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
      }
      return initialState;
    case POST_HISTORY_SUCCESS:
      if (
        action.history?.entrance?.id &&
        action.history?.entrance?.id === state.data?.id
      ) {
        return {
          ...initialState,
          data: {
            ...state.data,
            histories: [...state.data.histories, action.history]
          }
        };
      }
      return initialState;
    case UPDATE_HISTORY_SUCCESS:
      if (
        action.history?.entrance?.id &&
        action.history?.entrance?.id === state.data?.id
      ) {
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
      }
      return initialState;
    case POST_DESCRIPTION_SUCCESS:
      if (
        action.description?.entrance?.id &&
        action.description?.entrance?.id === state.data?.id
      ) {
        return {
          ...initialState,
          data: {
            ...state.data,
            descriptions: state.data.descriptions
              ? [...state.data.descriptions, action.description]
              : [action.description]
          }
        };
      }
      return initialState;
    case UPDATE_DESCRIPTION_SUCCESS:
      if (
        action.description?.entrance?.id &&
        action.description?.entrance?.id === state.data?.id
      ) {
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
      }
      return initialState;
    case POST_RIGGINGS_SUCCESS:
      if (
        action.riggings?.entrance?.id &&
        action.riggings?.entrance?.id === state.data?.id
      ) {
        return {
          ...initialState,
          data: {
            ...state.data,
            riggings: state.data.riggings
              ? [...state.data.riggings, transformRiggings(action.riggings)]
              : [action.riggings]
          }
        };
      }
      return initialState;
    case UPDATE_RIGGINGS_SUCCESS:
      if (
        action.riggings?.entrance?.id &&
        action.riggings?.entrance?.id === state.data?.id
      ) {
        return {
          ...initialState,
          data: {
            ...state.data,
            riggings: [
              ...state.data.riggings.filter(l => l.id !== action.riggings.id),
              {
                ...transformRiggings(action.riggings),
                entrance: action.riggings.entrance.id
              }
            ]
          }
        };
      }
      return initialState;
    case POST_COMMENT_SUCCESS:
      if (
          action.comment?.entrance?.id &&
          action.comment?.entrance?.id === state.data?.id
      ) {
        return {
          ...initialState,
          data: {
            ...state.data,
            comments: state.data.comments
                ? [...state.data.comments, action.comment]
                : [action.comment]
          }
        };
      }
      return initialState;
    case UPDATE_COMMENT_SUCCESS:
      if (
          action.comment?.entrance?.id &&
          action.comment?.entrance?.id === state.data?.id
      ) {
        return {
          ...initialState,
          data: {
            ...state.data,
            comments: [
              ...state.data.comments.filter(l => l.id !== action.comment.id),
              { ...action.comment, entrance: action.comment.entrance.id }
            ]
          }
        };
      }
      return initialState;
    default:
      return state;
  }
};

export default reducer;
