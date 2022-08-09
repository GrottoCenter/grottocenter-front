import {
  POST_HISTORY,
  POST_HISTORY_FAILURE,
  POST_HISTORY_SUCCESS
} from '../actions/History/CreateHistory';

const initialState = {
  error: null,
  isLoading: false,
  history: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_HISTORY:
      return {
        ...initialState,
        isLoading: true
      };
    case POST_HISTORY_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        history: action.history
      };
    case POST_HISTORY_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
