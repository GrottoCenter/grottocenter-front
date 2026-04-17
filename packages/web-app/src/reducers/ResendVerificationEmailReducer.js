import {
  FETCH_RESEND_VERIFICATION,
  FETCH_RESEND_VERIFICATION_FAILURE,
  FETCH_RESEND_VERIFICATION_SUCCESS,
  RESET_RESEND_VERIFICATION
} from '../actions/ResendVerificationEmail';

const initialState = {
  error: null,
  isFetching: false,
  success: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_RESEND_VERIFICATION:
      return {
        ...state,
        isFetching: true,
        error: null,
        success: false
      };
    case FETCH_RESEND_VERIFICATION_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        error: null
      };
    case FETCH_RESEND_VERIFICATION_FAILURE:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.error
      };
    case RESET_RESEND_VERIFICATION:
      return initialState;
    default:
      return state;
  }
};

export default reducer;
