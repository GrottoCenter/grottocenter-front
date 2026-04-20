import fetch from 'isomorphic-fetch';
import { resendVerificationEmailUrl } from '../conf/apiRoutes';

export const RESEND_VERIFICATION = 'RESEND_VERIFICATION';
export const RESEND_VERIFICATION_SUCCESS = 'RESEND_VERIFICATION_SUCCESS';
export const RESEND_VERIFICATION_FAILURE = 'RESEND_VERIFICATION_FAILURE';
export const RESET_RESEND_VERIFICATION = 'RESET_RESEND_VERIFICATION';

export const resendVerification = () => ({
  type: RESEND_VERIFICATION
});

export const resendVerificationSuccess = () => ({
  type: RESEND_VERIFICATION_SUCCESS
});

export const resendVerificationFailure = error => ({
  type: RESEND_VERIFICATION_FAILURE,
  error
});

export const resetResendVerification = () => ({
  type: RESET_RESEND_VERIFICATION
});

export function postResendVerificationEmail(email) {
  return dispatch => {
    dispatch(resendVerification());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ email })
    };

    return fetch(resendVerificationEmailUrl, requestOptions)
      .then(() => {
        // We always dispatch success to the UI to avoid revealing if an email exists
        dispatch(resendVerificationSuccess());
      })
      .catch(() => {
        // Even on network error, we dispatch success to the UI
        dispatch(resendVerificationSuccess());
      });
  };
}
