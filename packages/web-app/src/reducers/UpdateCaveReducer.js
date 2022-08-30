import {
  UPDATE_CAVE,
  UPDATE_CAVE_FAILURE,
  UPDATE_CAVE_SUCCESS
} from '../actions/Cave/UpdateCave';

const initialState = {
  loading: false,
  error: null,
  data: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_CAVE:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case UPDATE_CAVE_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case UPDATE_CAVE_SUCCESS:
      return {
        ...state,
        data: action.cave,
        error: initialState.error,
        loading: false
      };
    default:
      return state;
  }
};

export default reducer;
