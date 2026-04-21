import fetch from 'isomorphic-fetch';
import { verifyEmailUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const VERIFY_EMAIL = 'VERIFY_EMAIL';
export const VERIFY_EMAIL_SUCCESS = 'VERIFY_EMAIL_SUCCESS';
export const VERIFY_EMAIL_FAILURE = 'VERIFY_EMAIL_FAILURE';

export const verifyEmail = () => ({
  type: VERIFY_EMAIL
});

export const verifyEmailSuccess = status => ({
  type: VERIFY_EMAIL_SUCCESS,
  status
});

export const verifyEmailFailure = error => ({
  type: VERIFY_EMAIL_FAILURE,
  error
});

export function getVerifyEmail(token) {
  return dispatch => {
    dispatch(verifyEmail());

    return fetch(verifyEmailUrl(token), { method: 'GET' })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw response;
      })
      .then(json => {
        dispatch(verifyEmailSuccess(json.message));
      })
      .catch(async response => {
        if (typeof response.status !== 'undefined') {
          const statusCode = response.status;
          let errorMessage = '';
          try {
            const text = await response.text();
            try {
              const json = JSON.parse(text);
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
            verifyEmailFailure(
              makeErrorMessage(statusCode, errorMessage || 'Unknown error')
            )
          );
        } else {
          dispatch(
            verifyEmailFailure(
              makeErrorMessage(500, `VerifyEmail - ${response.message}`)
            )
          );
        }
      });
  };
}
