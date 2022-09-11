import {
  UPDATE_ENTRANCE,
  UPDATE_ENTRANCE_ERROR,
  UPDATE_ENTRANCE_SUCCESS
} from '../actions/Entrance/UpdateEntrance';

const initialState = {
  loading: false,
  error: null,
  data: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_ENTRANCE:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case UPDATE_ENTRANCE_ERROR:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case UPDATE_ENTRANCE_SUCCESS:
      return {
        ...state,
        error: initialState.error,
        loading: false
      };
    default:
      return state;
  }
};

export default reducer;
