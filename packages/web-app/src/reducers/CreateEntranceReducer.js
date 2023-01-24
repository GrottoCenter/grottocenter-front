import {
  POST_ENTRANCE,
  POST_ENTRANCE_FAILURE,
  POST_ENTRANCE_SUCCESS
} from '../actions/Entrance/CreateEntrance';

const initialState = {
  loading: false,
  error: null,
  data: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_ENTRANCE:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case POST_ENTRANCE_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case POST_ENTRANCE_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        loading: false,
        data: action.data
      };
    default:
      return state;
  }
};

export default reducer;
