import fetch from 'isomorphic-fetch';
import { resendVerificationEmailUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_RESEND_VERIFICATION = 'FETCH_RESEND_VERIFICATION';
export const FETCH_RESEND_VERIFICATION_SUCCESS = 'FETCH_RESEND_VERIFICATION_SUCCESS';
export const FETCH_RESEND_VERIFICATION_FAILURE = 'FETCH_RESEND_VERIFICATION_FAILURE';
export const RESET_RESEND_VERIFICATION = 'RESET_RESEND_VERIFICATION';

export const fetchResendVerification = () => ({
  type: FETCH_RESEND_VERIFICATION
});

export const fetchResendVerificationSuccess = () => ({
  type: FETCH_RESEND_VERIFICATION_SUCCESS
});

export const fetchResendVerificationFailure = error => ({
  type: FETCH_RESEND_VERIFICATION_FAILURE,
  error
});

export const resetResendVerification = () => ({
  type: RESET_RESEND_VERIFICATION
});

export function postResendVerificationEmail(email) {
  return dispatch => {
    dispatch(fetchResendVerification());

    const requestOptions = {
      method: 'POST'
    };

    return fetch(resendVerificationEmailUrl(email), requestOptions)
      .then(response => {
        if (response.ok || response.status === 204) {
          dispatch(fetchResendVerificationSuccess());
        } else {
          throw response;
        }
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
            fetchResendVerificationFailure(
              makeErrorMessage(statusCode, errorMessage || 'Unknown error')
            )
          );
        } else {
          dispatch(
            fetchResendVerificationFailure(
              makeErrorMessage(500, `ResendVerification - ${response.message}`)
            )
          );
        }
      });
  };
}
