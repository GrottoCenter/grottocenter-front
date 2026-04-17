import fetch from 'isomorphic-fetch';
import { verifyEmailUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_VERIFY_EMAIL = 'FETCH_VERIFY_EMAIL';
export const FETCH_VERIFY_EMAIL_SUCCESS = 'FETCH_VERIFY_EMAIL_SUCCESS';
export const FETCH_VERIFY_EMAIL_FAILURE = 'FETCH_VERIFY_EMAIL_FAILURE';

export const fetchVerifyEmail = () => ({
  type: FETCH_VERIFY_EMAIL
});

export const fetchVerifyEmailSuccess = message => ({
  type: FETCH_VERIFY_EMAIL_SUCCESS,
  message
});

export const fetchVerifyEmailFailure = error => ({
  type: FETCH_VERIFY_EMAIL_FAILURE,
  error
});

export function postVerifyEmail(token) {
  return dispatch => {
    dispatch(fetchVerifyEmail());

    const requestOptions = {
      method: 'POST'
    };

    return fetch(verifyEmailUrl(token), requestOptions)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw response;
      })
      .then(json => {
        dispatch(fetchVerifyEmailSuccess(json.message));
      })
      .catch(async response => {
        if (typeof response.status !== 'undefined') {
          const statusCode = response.status;
          let errorMessage = '';
          try {
            const json = await response.json();
            errorMessage = json.message || json.error || (await response.text());
          } catch (e) {
            errorMessage = await response.text();
          }

          if (statusCode === 500) {
            errorMessage =
              'A server error occurred, please try again later or contact Wikicaves for more information.';
          }

          dispatch(
            fetchVerifyEmailFailure(
              makeErrorMessage(statusCode, errorMessage || 'Unknown error')
            )
          );
        } else {
          dispatch(
            fetchVerifyEmailFailure(
              makeErrorMessage(500, `VerifyEmail - ${response.message}`)
            )
          );
        }
      });
  };
}
