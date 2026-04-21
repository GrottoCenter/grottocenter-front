import fetch from 'isomorphic-fetch';
import { forgotPasswordUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';
import { fetchLoginNotVerified, displayLoginDialog } from './Login';

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
          const json = await response.json();
          if (statusCode === 401 && json?.status === 'NotVerified') {
            dispatch(displayLoginDialog('forgotPassword'));
            dispatch(fetchLoginNotVerified('forgotPassword', data.email));
            dispatch(fetchForgotPasswordSuccess()); // Clear loading state on page
            return;
          }
          errorMessage = json.message || json.error || (await response.text());
        } catch (e) {
          errorMessage = await response.text();
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
