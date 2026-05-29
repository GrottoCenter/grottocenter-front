import {
  FETCH_LOGIN,
  FETCH_LOGIN_FAILURE,
  FETCH_LOGIN_MUST_RESET,
  FETCH_LOGIN_NOT_VERIFIED,
  FETCH_LOGIN_MFA_REQUIRED,
  FETCH_LOGIN_MFA_ENROLLMENT_REQUIRED,
  FETCH_LOGIN_SUCCESS,
  FETCH_LOGIN_RESET_SUCCESS,
  DISPLAY_LOGIN_DIALOG,
  HIDE_LOGIN_DIALOG,
  LOGOUT,
  decodeJWT
} from '../actions/Login';
import { authTokenName } from '../conf/config';

const removeTokenFromLocalStorage = () => {
  window.localStorage.removeItem(authTokenName);
};

const getRawTokenIfNotExpired = () => {
  const rawToken = window.localStorage.getItem(authTokenName);
  const token = decodeJWT(rawToken);
  if (token === null) {
    return null;
  }
  // JS uses miliseconds for Unix time while JWT uses seconds
  if (new Date(token.exp * 1000) > Date.now()) {
    return rawToken;
  }
  removeTokenFromLocalStorage();
  return null;
};

const initialState = {
  authTokenDecoded: decodeJWT(getRawTokenIfNotExpired()),
  authorizationHeader: {
    Authorization: `Bearer ${getRawTokenIfNotExpired()}`
  },
  enrollmentToken: null,
  error: null,
  isFetching: false,
  isLoginDialogDisplayed: false,
  isMfaRequiredDisplayed: false,
  isMfaEnrollmentRequiredDisplayed: false,
  isMustResetMessageDisplayed: false,
  isNotVerifiedMessageDisplayed: false,
  notVerifiedContext: 'login',
  notVerifiedEmail: ''
};

//
//
// R E D U C E R
//
//
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LOGIN:
      return {
        ...state,
        authToken: undefined,
        authorizationHeader: undefined,
        isFetching: true,
        error: null
      };
    case FETCH_LOGIN_SUCCESS:
      window.localStorage.setItem(authTokenName, action.token);
      return {
        ...state,
        authToken: action.token,
        authorizationHeader: { Authorization: `Bearer ${action.token}` },
        enrollmentToken: null,
        error: null,
        isFetching: false,
        isMfaRequiredDisplayed: false,
        isMfaEnrollmentRequiredDisplayed: false,
        authTokenDecoded: action.tokenDecoded
      };
    case FETCH_LOGIN_MUST_RESET:
      return {
        ...state,
        isFetching: false,
        isMustResetMessageDisplayed: true,
        isNotVerifiedMessageDisplayed: false
      };
    case FETCH_LOGIN_MFA_REQUIRED:
      return {
        ...state,
        isFetching: false,
        isMfaRequiredDisplayed: true,
        isMfaEnrollmentRequiredDisplayed: false
      };
    case FETCH_LOGIN_MFA_ENROLLMENT_REQUIRED:
      return {
        ...state,
        isFetching: false,
        isMfaEnrollmentRequiredDisplayed: true,
        isMfaRequiredDisplayed: false,
        enrollmentToken: action.enrollmentToken
      };
    case FETCH_LOGIN_NOT_VERIFIED:
      return {
        ...state,
        isFetching: false,
        isNotVerifiedMessageDisplayed: true,
        notVerifiedContext: action.context || 'login',
        notVerifiedEmail: action.email || '',
        isMustResetMessageDisplayed: false
      };
    case FETCH_LOGIN_FAILURE:
      return {
        ...state,
        isFetching: false,
        error: action.error
      };
    case FETCH_LOGIN_RESET_SUCCESS:
      return {
        ...state,
        isFetching: false
      };
    case DISPLAY_LOGIN_DIALOG:
      return {
        ...state,
        isLoginDialogDisplayed: true,
        isMfaRequiredDisplayed: false,
        isMfaEnrollmentRequiredDisplayed: false,
        enrollmentToken: null,
        isMustResetMessageDisplayed: false,
        isNotVerifiedMessageDisplayed: false,
        notVerifiedContext: action.notVerifiedContext || 'login'
      };
    case HIDE_LOGIN_DIALOG:
      return {
        ...state,
        isLoginDialogDisplayed: false,
        isMfaRequiredDisplayed: false,
        isMfaEnrollmentRequiredDisplayed: false,
        enrollmentToken: null,
        isMustResetMessageDisplayed: false,
        isNotVerifiedMessageDisplayed: false,
        notVerifiedContext: 'login'
      };
    case LOGOUT:
      removeTokenFromLocalStorage();
      return {
        ...state,
        authToken: undefined,
        authorizationHeader: undefined,
        authTokenDecoded: null
      };
    default:
      return state;
  }
};

export default reducer;
