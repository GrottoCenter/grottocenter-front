import {
  UPDATE_HISTORY,
  UPDATE_HISTORY_FAILURE,
  UPDATE_HISTORY_SUCCESS
} from '../actions/History/UpdateHistory';

const initialState = {
  error: null,
  isLoading: false,
  history: null
};

const updateHistory = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_HISTORY:
      return {
        ...initialState,
        isLoading: true
      };
    case UPDATE_HISTORY_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        history: action.history
      };
    case UPDATE_HISTORY_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default updateHistory;
