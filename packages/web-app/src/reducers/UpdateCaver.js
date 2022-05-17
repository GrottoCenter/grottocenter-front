import {
  UPDATE_CAVER,
  UPDATE_CAVER_FAILURE,
  UPDATE_CAVER_SUCCESS
} from '../actions/UpdateUser';

const initialState = {
  error: null,
  isLoading: false,
  caver: null
};

const updateCaver = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_CAVER:
      return {
        ...state,
        isLoading: true
      };
    case UPDATE_CAVER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        data: action.caver
      };
    case UPDATE_CAVER_FAILURE:
      return {
        ...state,
        error: action.error
      };
    default:
      return state;
  }
};

export default updateCaver;
