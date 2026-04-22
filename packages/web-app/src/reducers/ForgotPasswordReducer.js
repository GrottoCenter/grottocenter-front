import {
  FETCH_FORGOT_PASSWORD_SUCCESS,
  FETCH_FORGOT_PASSWORD,
  FETCH_FORGOT_PASSWORD_FAILURE
} from '../actions/ForgotPassword';

const initialState = {
  error: null,
  isFetching: false,
  success: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_FORGOT_PASSWORD:
      return {
        ...state,
        isFetching: true,
        error: null,
        success: false
      };
    case FETCH_FORGOT_PASSWORD_SUCCESS:
      return {
        ...state,
        error: null,
        isFetching: false,
        success: true
      };
    case FETCH_FORGOT_PASSWORD_FAILURE:
      return {
        ...state,
        isFetching: false,
        error: action.error,
        success: false
      };
    case RESET_FORGOT_PASSWORD:
      return initialState;
    default:
      return state;
  }
};

export default reducer;
