import { useMutation } from '@tanstack/react-query';

import {
  loginUrl,
  mfaEnrollUrl,
  mfaVerifyUrl,
  mfaResetUrl
} from '../../conf/apiRoutes';
import store from '../../store';
import {
  decodeJWT,
  fetchLoginSuccess,
  hideLoginDialog,
  postLogout
} from '../../actions/Login';

// MFA flows sit at the boundary of the migration: the login slice stays
// authoritative for session state (JWT, dialog visibility), so the mutations
// dispatch into Redux on success. This keeps the login flow single-sourced.

// Small helper: raw fetch with an ad-hoc bearer (enrollment token during
// enroll/verify, or nothing for the mfaLogin retry). Bypasses api/client
// on purpose — the auth header for these calls is not always the
// standard `login.authorizationHeader` (enrollment token isn't stored in
// authorizationHeader).
const rawFetchJson = async (url, { method = 'POST', headers, body } = {}) => {
  const response = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(json?.status ?? 'error');
    err.status = response.status;
    err.body = json;
    throw err;
  }
  return json;
};

// Step 1 of enrollment: POST /mfa/enroll (bearer = enrollment token from
// the login response). Returns { secret, otpauthUri } — the QR-code inputs
// for the authenticator app. mutation.data survives across steps 2 and 3
// of the wizard so the UI does not need a separate cache.
export const useMfaEnroll = () =>
  useMutation({
    mutationFn: async () => {
      const { enrollmentToken } = store.getState().login;
      const json = await rawFetchJson(mfaEnrollUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${enrollmentToken}`
        }
      });
      return { secret: json.secret, otpauthUri: json.otpauthUri };
    }
  });

// Step 3 of enrollment: POST /mfa/verify with the TOTP code. On success the
// server returns a real bearer JWT — dispatch it into login state and close
// the dialog. On 401 with a non-TOTP status the enrollment token itself
// expired; the UI reads that flag to prompt a fresh login.
export const useMfaVerify = () =>
  useMutation({
    mutationFn: async code => {
      const { enrollmentToken } = store.getState().login;
      try {
        const json = await rawFetchJson(mfaVerifyUrl, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${enrollmentToken}`
          },
          body: { totpCode: code }
        });
        store.dispatch(fetchLoginSuccess(decodeJWT(json.token), json.token));
        store.dispatch(hideLoginDialog());
        return json;
      } catch (err) {
        const totpStatuses = ['InvalidTotpCode', 'TotpAlreadyUsed'];
        err.isEnrollmentTokenExpired =
          err?.status === 401 && !totpStatuses.includes(err?.body?.status);
        throw err;
      }
    }
  });

// Login-side MFA: for admins with MFA already enabled, the login endpoint
// wants { email, password, totpCode } in one shot (no separate enrollment
// step). Same success side-effects as useMfaVerify.
export const useMfaLogin = () =>
  useMutation({
    mutationFn: async ({ email, password, code }) => {
      const json = await rawFetchJson(loginUrl, {
        headers: { 'Content-Type': 'application/json' },
        body: { email, password, totpCode: code }
      });
      store.dispatch(fetchLoginSuccess(decodeJWT(json.token), json.token));
      store.dispatch(hideLoginDialog());
      return json;
    }
  });

// Self-service reset from the Account page. Success triggers a delayed
// logout (the account page holds the delay so the confirmation notice
// stays visible). A 401 that is not a "Mismatch" means the session
// itself is invalid — logout immediately.
export const useMfaReset = () =>
  useMutation({
    mutationFn: async password => {
      const { authorizationHeader } = store.getState().login;
      try {
        return await rawFetchJson(mfaResetUrl, {
          headers: {
            'Content-Type': 'application/json',
            ...authorizationHeader
          },
          body: { password }
        });
      } catch (err) {
        if (err?.status === 401 && err?.body?.status !== 'Mismatch') {
          store.dispatch(postLogout());
        }
        throw err;
      }
    }
  });
