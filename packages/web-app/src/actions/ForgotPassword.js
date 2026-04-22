import fetch from 'isomorphic-fetch';
import { forgotPasswordUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';
import { fetchLoginNotVerified, displayLoginDialog } from './Login';

export const FETCH_FORGOT_PASSWORD = 'FETCH_FORGOT_PASSWORD';
export const FETCH_FORGOT_PASSWORD_SUCCESS = 'FETCH_FORGOT_PASSWORD_SUCCESS';
export const FETCH_FORGOT_PASSWORD_FAILURE = 'FETCH_FORGOT_PASSWORD_FAILURE';
export const RESET_FORGOT_PASSWORD = 'RESET_FORGOT_PASSWORD';

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

export const resetForgotPassword = () => ({
  type: RESET_FORGOT_PASSWORD
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

    return fetch(forgotPasswordUrl, requestOptions)
      .then(response => {
        if (response.ok) {
          // there is no content in the response in case of success
          dispatch(fetchForgotPasswordSuccess());
        } else {
          throw response;
        }
      })
      .catch(async response => {
        const statusCode = response.status;
        let errorMessage = '';
        try {
          const text = await response.text();
          try {
            const json = JSON.parse(text);
            if (statusCode === 401 && json?.status === 'NotVerified') {
              dispatch(displayLoginDialog('forgotPassword'));
              dispatch(fetchLoginNotVerified('forgotPassword', data.email));
              dispatch(resetForgotPassword()); // Clear loading state on page
              return;
            }
            errorMessage = json.message || json.error || text;
          } catch (e) {
            errorMessage = text;
          }
        } catch (e) {
          errorMessage = 'Unknown error';
        }

        if (statusCode === 500) {
          errorMessage =
            'A server error occurred, please try again later or contact Wikicaves for more information.';
        }
        dispatch(
          fetchForgotPasswordFailure(
            makeErrorMessage(statusCode, `Forgot password - ${errorMessage}`)
          )
        );
      });
  };
}
