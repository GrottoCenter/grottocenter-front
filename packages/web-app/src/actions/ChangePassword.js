import fetch from 'isomorphic-fetch';
import { changePasswordUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

// ==========
export const FETCH_CHANGE_PASSWORD = 'FETCH_CHANGE_PASSWORD';
export const FETCH_CHANGE_PASSWORD_SUCCESS = 'FETCH_CHANGE_PASSWORD_SUCCESS';
export const FETCH_CHANGE_PASSWORD_FAILURE = 'FETCH_CHANGE_PASSWORD_FAILURE';

// ==========

export const fetchChangePassword = () => ({
  type: FETCH_CHANGE_PASSWORD
});

export const fetchChangePasswordSuccess = () => ({
  type: FETCH_CHANGE_PASSWORD_SUCCESS
});

export const fetchChangePasswordFailure = error => ({
  type: FETCH_CHANGE_PASSWORD_FAILURE,
  error
});

export function postChangePassword(password, resetPasswordToken) {
  return dispatch => {
    dispatch(fetchChangePassword());

    const requestOptions = {
      method: 'PATCH',
      body: JSON.stringify({ password, token: resetPasswordToken })
    };

    return fetch(changePasswordUrl, requestOptions)
      .then(response => {
        if (response.ok) {
          // there is no content in the response in case of success
          dispatch(fetchChangePasswordSuccess());
        } else {
          throw response;
        }
      })
      .catch(response => {
        const statusCode = response.status;
        response.text().then(responseText => {
          const errorMessage =
            statusCode === 500
              ? 'A server error occurred, please try again later or contact Wikicaves for more information.'
              : responseText;
          dispatch(
            fetchChangePasswordFailure(
              makeErrorMessage(statusCode, `ChangePassword - ${errorMessage}`)
            )
          );
        });
      });
  };
}
