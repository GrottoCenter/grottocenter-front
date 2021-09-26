import fetch from 'isomorphic-fetch';
import { forgotPassword } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_FORGOT_PASSWORD = 'FETCH_FORGOT_PASSWORD';
export const FETCH_FORGOT_PASSWORD_SUCCESS = 'FETCH_FORGOT_PASSWORD_SUCCESS';
export const FETCH_FORGOT_PASSWORD_FAILURE = 'FETCH_FORGOT_PASSWORD_FAILURE';

export const fetchForgotPassword = () => ({
  type: FETCH_FORGOT_PASSWORD
});

export const fetchForgotPasswordSuccess = () => ({
  type: FETCH_FORGOT_PASSWORD_SUCCESS
});

export const fetchForgotPasswordFailure = error => ({
  type: FETCH_FORGOT_PASSWORD_FAILURE,
  error
});

/**
 *
 * @param {*} data with the following structure:
 * - email {String} (optional)
 */
export function postForgotPassword(data) {
  return dispatch => {
    dispatch(fetchForgotPassword());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    return fetch(forgotPassword, requestOptions)
      .then(response => {
        if (response.ok) {
          // there is no content in the response in case of success
          dispatch(fetchForgotPasswordSuccess());
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
            fetchForgotPasswordFailure(
              makeErrorMessage(statusCode, `Forgot password - ${errorMessage}`)
            )
          );
        });
      });
  };
}
