import {
  POST_BAN_CAVER,
  POST_BAN_CAVER_SUCCESS,
  POST_BAN_CAVER_FAILURE,
  POST_UNBAN_CAVER,
  POST_UNBAN_CAVER_SUCCESS,
  POST_UNBAN_CAVER_FAILURE
} from '../actions/Person/BanCaver';

const initialState = {
  error: null,
  isLoading: false,
  isSuccess: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_BAN_CAVER:
    case POST_UNBAN_CAVER:
      return {
        isLoading: true,
        isSuccess: false,
        error: null
      };
    case POST_BAN_CAVER_SUCCESS:
    case POST_UNBAN_CAVER_SUCCESS:
      return {
        isLoading: false,
        isSuccess: true,
        error: null
      };
    case POST_BAN_CAVER_FAILURE:
    case POST_UNBAN_CAVER_FAILURE:
      return {
        isLoading: false,
        isSuccess: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
