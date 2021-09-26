import {
  FETCH_FORGOT_PASSWORD_SUCCESS,
  FETCH_FORGOT_PASSWORD,
  FETCH_FORGOT_PASSWORD_FAILURE
} from '../actions/ForgotPassword';

const initialState = {
  error: null,
  isFetching: false
};

const forgotPassword = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_FORGOT_PASSWORD:
      return {
        ...state,
        isFetching: true,
        error: null
      };
    case FETCH_FORGOT_PASSWORD_SUCCESS:
      return {
        ...state,
        error: null,
        isFetching: false
      };
    case FETCH_FORGOT_PASSWORD_FAILURE:
      return {
        ...state,
        isFetching: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default forgotPassword;
