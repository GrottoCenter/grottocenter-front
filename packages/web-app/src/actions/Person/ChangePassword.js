import fetch from 'isomorphic-fetch';
import { changePasswordUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus, checkAuthStatus } from '../utils';

export const FETCH_CHANGE_PASSWORD = 'FETCH_CHANGE_PASSWORD';
export const FETCH_CHANGE_PASSWORD_SUCCESS = 'FETCH_CHANGE_PASSWORD_SUCCESS';
export const FETCH_CHANGE_PASSWORD_FAILURE = 'FETCH_CHANGE_PASSWORD_FAILURE';

const fetchChangePassword = () => ({ type: FETCH_CHANGE_PASSWORD });
const fetchChangePasswordSuccess = () => ({
  type: FETCH_CHANGE_PASSWORD_SUCCESS
});
const fetchChangePasswordFailure = error => ({
  type: FETCH_CHANGE_PASSWORD_FAILURE,
  error
});

export function postChangePassword(password, resetPasswordToken) {
  return (dispatch, getState) => {
    dispatch(fetchChangePassword());

    let requestOptions;
    let statusChecker;
    if (resetPasswordToken) {
      requestOptions = {
        method: 'PATCH',
        body: JSON.stringify({ password, token: resetPasswordToken })
      };
      statusChecker = checkAndGetStatus;
    } else {
      requestOptions = {
        method: 'PATCH',
        body: JSON.stringify({ password }),
        headers: getState().login.authorizationHeader
      };
      statusChecker = checkAuthStatus(dispatch);
    }

    return fetch(changePasswordUrl, requestOptions)
      .then(statusChecker)
      .then(() => dispatch(fetchChangePasswordSuccess()))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(fetchChangePasswordFailure(error));
      });
  };
}
