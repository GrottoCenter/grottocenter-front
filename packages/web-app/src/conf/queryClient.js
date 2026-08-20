import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';

import store from '../store';
import { setQueryClient } from '../api/queryClientRef';
import { postLogout } from '../actions/Login';

/**
 * staleTime tiers. Pick one rather than inventing a number at the call site, so
 * that "how fresh must this be" is a decision taken once per kind of data.
 */
export const STALE = {
  /** Reference data the API only changes on a deploy (formats, licenses, …). */
  STATIC: Infinity,
  /** Domain details and lists (a cave, a document, a massif). */
  STANDARD: 5 * 60 * 1000,
  /** Search results, notifications — cheap to refetch, wrong when stale. */
  VOLATILE: 30 * 1000
};

/**
 * Shared options for the static reference lists.
 *
 * `gcTime` has to match `staleTime` here: with the 5-minute default, a list
 * whose last consumer unmounts is garbage-collected and refetched on the next
 * mount — precisely the redundant refetch this migration removes.
 */
export const REFERENCE_QUERY = {
  staleTime: STALE.STATIC,
  gcTime: STALE.STATIC
};

// react-intl lives inside React, and this handler runs outside it, so the
// message catalogue is read straight from the store. Falls back to the raw text
// when the locale file has no entry for the code — same contract as
// formatMessage({ id }, { defaultMessage }).
const translate = (id, fallback) => {
  const { locale, messages } = store.getState().intl;
  return messages?.[locale]?.[id] ?? fallback;
};

const notifyError = (error, meta) => {
  // 401 anywhere means the session is gone; drop it once, centrally, instead of
  // letting every caller discover it. Replaces the per-thunk checkAuthStatus.
  if (error?.status === 401) {
    store.dispatch(postLogout());
    return;
  }
  const fallback =
    meta?.errorMessage ??
    translate('unexpected error', 'An unexpected error occurred');
  const code = error?.body?.code;
  enqueueSnackbar(code ? translate(code, fallback) : fallback, {
    variant: 'error'
  });
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => notifyError(error, query.meta)
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) =>
      notifyError(error, mutation.meta)
  }),
  defaultOptions: {
    queries: {
      // ⚠️ LOAD-BEARING — do not restore the default.
      //
      // The app ships a service worker that caches API GETs with NetworkFirst
      // (see the `api-get` rule in vite.config.mjs): the contract is that the
      // request always leaves, and the worker answers from its 7-day cache when
      // the network is gone. That is what makes the app readable offline.
      //
      // React Query's default `networkMode: 'online'` never calls the queryFn
      // while navigator.onLine is false. The service worker would then never see
      // the request, and an offline user would get a permanent loading state
      // instead of the cached page — silently undoing the offline support.
      //
      // 'offlineFirst' always attempts the first request and only pauses the
      // retries, which is exactly the semantics an offline-capable cache below
      // us needs.
      networkMode: 'offlineFirst',

      // The default (3 attempts, exponential backoff) compounds with the service
      // worker's 5s networkTimeoutSeconds: a genuinely dead request would take
      // ~25s to surface, against a single attempt today.
      retry: 1,

      // Explicit, not inherited: the app never refetched on focus, and turning
      // that on by accident would multiply real API calls across the board.
      refetchOnWindowFocus: false
    }
  }
});

// Publish the singleton for non-React callers (middlewares/queryInvalidationBridge)
// that cannot import this file directly without closing a cycle.
setQueryClient(queryClient);

export default queryClient;
