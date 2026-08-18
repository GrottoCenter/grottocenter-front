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
  SET_IMPERSONATED_ROLE,
  CLEAR_IMPERSONATION,
  decodeJWT
} from '../actions/Login';
import { authTokenName } from '../conf/config';
import {
  IMPERSONATED_ROLE_KEY,
  isImpersonatableRole
} from '../utils/impersonation';

// Per-tab so a forgotten impersonation cannot leak across tabs or persist after
// the browser is closed. See ImpersonationIndicator for the UI.

const removeTokenFromLocalStorage = () => {
  window.localStorage.removeItem(authTokenName);
};

const readImpersonatedRole = () => {
  try {
    const roleName =
      window.sessionStorage.getItem(IMPERSONATED_ROLE_KEY) || null;
    if (isImpersonatableRole(roleName)) return roleName;
    window.sessionStorage.removeItem(IMPERSONATED_ROLE_KEY);
    return null;
  } catch {
    return null;
  }
};

const writeImpersonatedRole = roleName => {
  try {
    if (roleName) {
      window.sessionStorage.setItem(IMPERSONATED_ROLE_KEY, roleName);
    } else {
      window.sessionStorage.removeItem(IMPERSONATED_ROLE_KEY);
    }
  } catch {
    /* sessionStorage disabled — impersonation just won't survive a refresh */
  }
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
  impersonatedRole: readImpersonatedRole(),
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
      writeImpersonatedRole(null);
      return {
        ...state,
        authToken: action.token,
        authorizationHeader: { Authorization: `Bearer ${action.token}` },
        enrollmentToken: null,
        error: null,
        isFetching: false,
        isMfaRequiredDisplayed: false,
        isMfaEnrollmentRequiredDisplayed: false,
        authTokenDecoded: action.tokenDecoded,
        impersonatedRole: null
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
      writeImpersonatedRole(null);
      return {
        ...state,
        authToken: undefined,
        authorizationHeader: undefined,
        authTokenDecoded: null,
        impersonatedRole: null
      };
    case SET_IMPERSONATED_ROLE:
      if (!isImpersonatableRole(action.roleName)) return state;
      writeImpersonatedRole(action.roleName);
      return {
        ...state,
        impersonatedRole: action.roleName
      };
    case CLEAR_IMPERSONATION:
      writeImpersonatedRole(null);
      return {
        ...state,
        impersonatedRole: null
      };
    default:
      return state;
  }
};

export default reducer;
