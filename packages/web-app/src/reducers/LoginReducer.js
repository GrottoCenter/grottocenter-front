import {
  FETCH_LOGIN,
  FETCH_LOGIN_FAILURE,
  FETCH_LOGIN_MUST_RESET,
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
  error: null,
  isFetching: false,
  isLoginDialogDisplayed: false,
  isMustResetMessageDisplayed: false
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
        error: null,
        isFetching: false,
        authTokenDecoded: action.tokenDecoded
      };
    case FETCH_LOGIN_MUST_RESET:
      return {
        ...state,
        isFetching: false,
        isMustResetMessageDisplayed: true
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
        isMustResetMessageDisplayed: false
      };
    case HIDE_LOGIN_DIALOG:
      return { ...state, isLoginDialogDisplayed: false };
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
