import {
  POST_CAVE,
  POST_CAVE_FAILURE,
  POST_CAVE_SUCCESS
} from '../actions/Cave';

const initialState = {
  loading: false,
  error: null,
  data: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_CAVE:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case POST_CAVE_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case POST_CAVE_SUCCESS:
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
