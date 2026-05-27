import {
  loginUrl,
  mfaEnrollUrl,
  mfaVerifyUrl,
  mfaResetUrl
} from '../conf/apiRoutes';
import { fetchLoginSuccess, hideLoginDialog, decodeJWT } from './Login';

export const FETCH_MFA_ENROLL = 'FETCH_MFA_ENROLL';
export const FETCH_MFA_ENROLL_SUCCESS = 'FETCH_MFA_ENROLL_SUCCESS';
export const FETCH_MFA_ENROLL_FAILURE = 'FETCH_MFA_ENROLL_FAILURE';

export const FETCH_MFA_VERIFY = 'FETCH_MFA_VERIFY';
export const FETCH_MFA_VERIFY_FAILURE = 'FETCH_MFA_VERIFY_FAILURE';

export const FETCH_MFA_RESET = 'FETCH_MFA_RESET';
export const FETCH_MFA_RESET_SUCCESS = 'FETCH_MFA_RESET_SUCCESS';
export const FETCH_MFA_RESET_FAILURE = 'FETCH_MFA_RESET_FAILURE';

export const CLEAR_MFA_STATE = 'CLEAR_MFA_STATE';

export const clearMfaState = () => ({ type: CLEAR_MFA_STATE });

export function postMfaEnroll() {
  return async (dispatch, getState) => {
    dispatch({ type: FETCH_MFA_ENROLL });
    const { enrollmentToken } = getState().login;
    try {
      const response = await fetch(mfaEnrollUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${enrollmentToken}`
        }
      });
      if (response.ok) {
        const json = await response.json();
        dispatch({
          type: FETCH_MFA_ENROLL_SUCCESS,
          secret: json.secret,
          otpauthUri: json.otpauthUri
        });
        return true;
      }
      dispatch({ type: FETCH_MFA_ENROLL_FAILURE, error: response.status });
      return false;
    } catch (_) {
      dispatch({ type: FETCH_MFA_ENROLL_FAILURE, error: 'network' });
      return false;
    }
  };
}

export function postMfaVerify(code) {
  return async (dispatch, getState) => {
    dispatch({ type: FETCH_MFA_VERIFY });
    const { enrollmentToken } = getState().login;
    try {
      const response = await fetch(mfaVerifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${enrollmentToken}`
        },
        body: JSON.stringify({ totpCode: code })
      });
      if (response.ok) {
        const json = await response.json();
        dispatch(fetchLoginSuccess(decodeJWT(json.token), json.token));
        dispatch(clearMfaState());
        dispatch(hideLoginDialog());
        return;
      }
      const json = await response.json().catch(() => ({}));
      const totpStatuses = ['InvalidTotpCode', 'TotpAlreadyUsed'];
      dispatch({
        type: FETCH_MFA_VERIFY_FAILURE,
        error: json?.status ?? 'error',
        isEnrollmentTokenExpired:
          response.status === 401 && !totpStatuses.includes(json?.status)
      });
    } catch (_) {
      dispatch({
        type: FETCH_MFA_VERIFY_FAILURE,
        error: 'network',
        isEnrollmentTokenExpired: false
      });
    }
  };
}

export function postMfaLogin(email, password, code) {
  return async dispatch => {
    dispatch({ type: FETCH_MFA_VERIFY });
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, totpCode: code })
      });
      if (response.ok) {
        const json = await response.json();
        dispatch(fetchLoginSuccess(decodeJWT(json.token), json.token));
        dispatch(clearMfaState());
        dispatch(hideLoginDialog());
        return;
      }
      const json = await response.json().catch(() => ({}));
      dispatch({
        type: FETCH_MFA_VERIFY_FAILURE,
        error: json?.status ?? 'error',
        isEnrollmentTokenExpired: false
      });
    } catch (_) {
      dispatch({
        type: FETCH_MFA_VERIFY_FAILURE,
        error: 'network',
        isEnrollmentTokenExpired: false
      });
    }
  };
}

export function postMfaReset(password) {
  return async (dispatch, getState) => {
    dispatch({ type: FETCH_MFA_RESET });
    const { authorizationHeader } = getState().login;
    try {
      const response = await fetch(mfaResetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authorizationHeader
        },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        dispatch({ type: FETCH_MFA_RESET_SUCCESS });
        return;
      }
      const json = await response.json().catch(() => ({}));
      dispatch({ type: FETCH_MFA_RESET_FAILURE, error: json?.status ?? 'error' });
    } catch (_) {
      dispatch({ type: FETCH_MFA_RESET_FAILURE, error: 'network' });
    }
  };
}
