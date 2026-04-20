import {
  VERIFY_EMAIL,
  VERIFY_EMAIL_FAILURE,
  VERIFY_EMAIL_SUCCESS
} from '../actions/VerifyEmail';

const initialState = {
  error: null,
  isFetching: false,
  success: false,
  message: ''
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case VERIFY_EMAIL:
      return {
        ...state,
        isFetching: true,
        error: null,
        success: false
      };
    case VERIFY_EMAIL_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        message: action.status,
        error: null
      };
    case VERIFY_EMAIL_FAILURE:
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
