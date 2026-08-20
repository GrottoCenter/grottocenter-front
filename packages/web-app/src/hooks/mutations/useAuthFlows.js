import { useMutation, useQuery } from '@tanstack/react-query';

import {
  changePasswordUrl,
  forgotPasswordUrl,
  resendVerificationEmailUrl,
  signUpUrl,
  verifyEmailUrl
} from '../../conf/apiRoutes';
import { apiGet, apiPatch, apiPost } from '../../api/client';
import store from '../../store';
import { displayLoginDialog, fetchLoginNotVerified } from '../../actions/Login';

// Auth-flow forms: sign-up, forgot-password, verify-email, resend-verification,
// change-password. Each replaces a slice with the same {isFetching, error,
// success} shape by exposing mutation.isPending / .error / .isSuccess.

// Reset flow uses the public token path (no bearer); the authenticated path
// sends the current-password check. The API distinguishes the two by request
// shape, so a single hook covers both — the caller passes the token when it
// has one.
export const useChangePassword = () =>
  useMutation({
    mutationFn: ({ password, token, currentPassword }) => {
      if (token) return apiPatch(changePasswordUrl, { password, token });
      return apiPatch(changePasswordUrl, { password, currentPassword });
    }
  });

// Sign-up preserves the legacy error shape { code, message, status } — the UI
// picks either `code` (structured errors like CAPTCHA_INVALID) or `message` as
// the translation-key hint. apiPost throws with body/status attached; we
// remap into that shape via onError→throw at the boundary so consumers stay
// unchanged.
const remapSignUpError = err => {
  const status = err?.status ?? null;
  const code = err?.body?.error || err?.body?.code || null;
  const message = err?.body?.message ?? err?.message ?? null;
  const wrapped = new Error(message ?? '');
  wrapped.code = code;
  wrapped.message = message;
  wrapped.status = status;
  return wrapped;
};

export const useSignUp = () =>
  useMutation({
    mutationFn: async data => {
      try {
        return await apiPost(signUpUrl, data);
      } catch (err) {
        throw remapSignUpError(err);
      }
    }
  });

// Verify-email is a GET fired on mount (with a token from the URL). Modeled
// as a query so the request is idempotent, cache-safe against
// StrictMode double-mount, and exposes the same {isFetching, error} shape.
// data.message drives the "already verified" hint on the page.
export const useVerifyEmail = token =>
  useQuery({
    queryKey: ['verifyEmail', token],
    queryFn: () => apiGet(verifyEmailUrl(token)),
    enabled: !!token,
    retry: false,
    // The endpoint mutates server state (marks the email verified) — never
    // refetch on background events, and never keep the entry as stale-warm.
    staleTime: Infinity,
    gcTime: 0
  });

// Forgot-password has a special "NotVerified 401" branch that redirects to
// the login dialog with a forgot-password context. Redux dispatch happens
// inline for that branch — cleaner than adding onError options at every
// call site, and the login slice stays authoritative for that path.
export const useForgotPassword = () =>
  useMutation({
    mutationFn: async data => {
      try {
        return await apiPost(forgotPasswordUrl, data);
      } catch (err) {
        if (err?.status === 401 && err?.body?.status === 'NotVerified') {
          store.dispatch(displayLoginDialog('forgotPassword'));
          store.dispatch(fetchLoginNotVerified('forgotPassword', data.email));
          // Return undefined so the mutation isn't marked as errored — the
          // UI already handled the redirect and would otherwise flash an
          // error banner during the transition.
          return undefined;
        }
        throw err;
      }
    }
  });

// Resend-verification always resolves — the legacy thunk swallowed network
// errors so the UI could not reveal whether an email actually exists.
// Preserve that contract by catching in the mutationFn.
export const useResendVerificationEmail = () =>
  useMutation({
    mutationFn: async email => {
      try {
        await apiPost(resendVerificationEmailUrl, { email });
      } catch {
        /* Intentional: keep the UI outcome opaque to observers. */
      }
      return undefined;
    }
  });
