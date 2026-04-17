import {
  FETCH_VERIFY_EMAIL,
  FETCH_VERIFY_EMAIL_FAILURE,
  FETCH_VERIFY_EMAIL_SUCCESS
} from '../actions/VerifyEmail';

const initialState = {
  error: null,
  isFetching: false,
  success: false,
  message: ''
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_VERIFY_EMAIL:
      return {
        ...state,
        isFetching: true,
        error: null,
        success: false
      };
    case FETCH_VERIFY_EMAIL_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        message: action.message,
        error: null
      };
    case FETCH_VERIFY_EMAIL_FAILURE:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
