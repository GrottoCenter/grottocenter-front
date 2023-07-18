// import fetch from 'isomorphic-fetch';
import { loginUrl, forgotPasswordUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

// ==========
export const FETCH_LOGIN = 'FETCH_LOGIN';
export const FETCH_LOGIN_SUCCESS = 'FETCH_LOGIN_SUCCESS';
export const FETCH_LOGIN_MUST_RESET = 'FETCH_LOGIN_MUST_RESET';
export const FETCH_LOGIN_FAILURE = 'FETCH_LOGIN_FAILURE';
export const FETCH_LOGIN_RESET_SUCCESS = 'FETCH_LOGIN_RESET_SUCCESS';

export const DISPLAY_LOGIN_DIALOG = 'DISPLAY_LOGIN_DIALOG';
export const HIDE_LOGIN_DIALOG = 'HIDE_LOGIN_DIALOG';

export const LOGOUT = 'LOGOUT';

// ==========

export const fetchLogin = () => ({
  type: FETCH_LOGIN
});

export const fetchLoginSuccess = (tokenDecoded, token) => ({
  type: FETCH_LOGIN_SUCCESS,
  tokenDecoded,
  token
});

export const fetchLoginMustReset = () => ({
  type: FETCH_LOGIN_MUST_RESET
});

export const fetchLoginResetSuccess = () => ({
  type: FETCH_LOGIN_RESET_SUCCESS
});

export const fetchLoginFailure = error => ({
  type: FETCH_LOGIN_FAILURE,
  error
});

export const displayLoginDialog = () => ({
  type: DISPLAY_LOGIN_DIALOG
});

export const hideLoginDialog = () => ({
  type: HIDE_LOGIN_DIALOG
});

export const logout = () => ({
  type: LOGOUT
});

export function postLogout() {
  return dispatch => {
    dispatch(logout());
  };
}

/**
 * Decode a JWT token BUT does NOT validate it.
 * Source: https://stackoverflow.com/a/38552302/16939610
 */
export function decodeJWT(token) {
  if (!token) return null;
  const tokenParts = token.split('.');
  const payload = tokenParts[1];
  // replaces all occurrences of "-" with "+" and "_" with "/" in the base64Url string
  // to conform to the base64 standard.
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      // With atob, special characters are not preserved.
      // They are decoded in the map function.
      .atob(base64)
      .split('')
      .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );
  return JSON.parse(jsonPayload);
}

export function postLogin(email, password) {
  return async dispatch => {
    dispatch(fetchLogin());
    let errorMessage = 'An unknown error occurred.';
    let responseStatus = 418;
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      responseStatus = response.status;
      if (response.ok) {
        const json = await response.json();
        dispatch(fetchLoginSuccess(decodeJWT(json.token), json.token));
        dispatch(hideLoginDialog());
        return;
      }

      if (responseStatus === 401) {
        const json = await response.json();
        if (json?.status === 'MustReset') {
          dispatch(fetchLoginMustReset());
          return;
        }

        errorMessage = 'Invalid email or password.';
      } else if (response.status === 500) {
        errorMessage =
          'A server error occurred, please try again later or contact Wikicaves for more information.';
      }
    } catch (_) {
      // Other errors
    }

    dispatch(
      fetchLoginFailure(
        makeErrorMessage(responseStatus, `Login - ${errorMessage}`)
      )
    );
  };
}

export function postForgotPassword(email, onSuccess) {
  return async dispatch => {
    dispatch(fetchLogin());
    let errorMessage = 'An unknown error occurred.';
    let responseStatus = 418;
    try {
      const response = await fetch(forgotPasswordUrl, {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      responseStatus = response.status;
      if (response.ok) {
        onSuccess(`Password reset email sent to {email}`);
        dispatch(fetchLoginResetSuccess());
        dispatch(hideLoginDialog());
        return;
      }

      const statusCode = response.status;
      const text = await response.text();
      errorMessage =
        statusCode === 500
          ? 'A server error occurred, please try again later or contact Wikicaves for more information.'
          : text;
    } catch (_) {
      // Other errors
    }

    dispatch(
      fetchLoginFailure(
        makeErrorMessage(responseStatus, `Forgot password - ${errorMessage}`)
      )
    );
  };
}
