import fetch from 'isomorphic-fetch';
import { signUpUrl } from '../conf/apiRoutes';

// ==========
export const FETCH_SIGN_UP = 'FETCH_SIGN_UP';
export const FETCH_SIGN_UP_SUCCESS = 'FETCH_SIGN_UP_SUCCESS';
export const FETCH_SIGN_UP_FAILURE = 'FETCH_SIGN_UP_FAILURE';

// ==========

export const fetchSignUp = () => ({
  type: FETCH_SIGN_UP
});

export const fetchSignUpSuccess = () => ({
  type: FETCH_SIGN_UP_SUCCESS
});

export const fetchSignUpFailure = error => ({
  type: FETCH_SIGN_UP_FAILURE,
  error
});

/**
 *
 * @param {*} data with the following structure:
 * - name {String} (optional)
 * - surname {String} (optional)
 * - nickname {String}
 * - email {String}
 * - password {String}
 * - website {String} — honeypot (must be empty)
 * - captchaToken {String} (optional) — Cloudflare Turnstile token
 */
export function postSignUp(data) {
  return async dispatch => {
    dispatch(fetchSignUp());

    try {
      const response = await fetch(signUpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // there is no content in the response in case of success
        dispatch(fetchSignUpSuccess());
        return;
      }

      const { status } = response;
      let code = null;
      let message = null;
      try {
        // Clone before parsing so the original body stream stays available
        // for the text() fallback if JSON parsing fails.
        const body = await response.clone().json();
        // `error` is the anti-bot/captcha response shape (e.g. CAPTCHA_INVALID),
        // `code` is the general structured-error shape used by other API endpoints.
        code = body.error || body.code || null;
        message = body.message || null;
      } catch {
        message = await response.text();
      }

      dispatch(fetchSignUpFailure({ code, message, status }));
    } catch (error) {
      dispatch(
        fetchSignUpFailure({
          code: null,
          message: error?.message || null,
          status: null
        })
      );
    }
  };
}
