import {
  FETCH_MFA_ENROLL,
  FETCH_MFA_ENROLL_SUCCESS,
  FETCH_MFA_ENROLL_FAILURE,
  FETCH_MFA_VERIFY,
  FETCH_MFA_VERIFY_FAILURE,
  FETCH_MFA_RESET,
  FETCH_MFA_RESET_SUCCESS,
  FETCH_MFA_RESET_FAILURE,
  CLEAR_MFA_STATE
} from '../actions/Mfa';

const initialState = {
  enroll: {
    isLoading: false,
    secret: null,
    otpauthUri: null,
    error: null
  },
  verify: {
    isLoading: false,
    error: null,
    isEnrollmentTokenExpired: false
  },
  reset: {
    isLoading: false,
    isSuccess: false,
    error: null
  }
};

const mfaReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MFA_ENROLL:
      return {
        ...state,
        enroll: { ...state.enroll, isLoading: true, error: null }
      };
    case FETCH_MFA_ENROLL_SUCCESS:
      return {
        ...state,
        enroll: {
          isLoading: false,
          secret: action.secret,
          otpauthUri: action.otpauthUri,
          error: null
        }
      };
    case FETCH_MFA_ENROLL_FAILURE:
      return {
        ...state,
        enroll: {
          ...state.enroll,
          isLoading: false,
          error: action.error
        }
      };
    case FETCH_MFA_VERIFY:
      return {
        ...state,
        verify: {
          isLoading: true,
          error: null,
          isEnrollmentTokenExpired: false
        }
      };
    case FETCH_MFA_VERIFY_FAILURE:
      return {
        ...state,
        verify: {
          isLoading: false,
          error: action.status,
          isEnrollmentTokenExpired: action.isEnrollmentTokenExpired
        }
      };
    case FETCH_MFA_RESET:
      return {
        ...state,
        reset: { isLoading: true, isSuccess: false, error: null }
      };
    case FETCH_MFA_RESET_SUCCESS:
      return {
        ...state,
        reset: { isLoading: false, isSuccess: true, error: null }
      };
    case FETCH_MFA_RESET_FAILURE:
      return {
        ...state,
        reset: { isLoading: false, isSuccess: false, error: action.error }
      };
    case CLEAR_MFA_STATE:
      return initialState;
    default:
      return state;
  }
};

export default mfaReducer;
