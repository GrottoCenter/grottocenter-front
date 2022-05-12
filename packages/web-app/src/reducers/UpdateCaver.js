import {
  UPDATE_CAVER,
  UPDATE_CAVER_FAILURE,
  UPDATE_CAVER_SUCCESS
} from '../actions/UpdateCaver';

const initialState = {
  error: null,
  isLoading: false,
  caver: null
};

const updateCaver = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_CAVER:
      return {
        ...initialState,
        isLoading: true
      };
    case UPDATE_CAVER_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        caver: action.caver
      };
    case UPDATE_CAVER_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default updateCaver;
