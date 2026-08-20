import fetch from 'isomorphic-fetch';

import store from '../store';
import { checkAndGetStatus } from '../actions/utils';

// Thin fetch wrapper for React Query's queryFn. Deliberately reuses the existing
// conventions instead of inventing new ones: checkAndGetStatus attaches `body`
// and `status` to the thrown error, which is what the global error handler in
// conf/queryClient.js reads, and what the AGENTS.md error contract describes.
//
// The auth header is read from the store at call time, never captured at module
// scope: a query mounted before login must still send the header once the
// session exists.
const authHeaders = () => store.getState().login.authorizationHeader ?? {};

/**
 * GET a JSON resource.
 *
 * Requests pass through the service worker (NetworkFirst), so this may resolve
 * from the offline cache — see the networkMode note in conf/queryClient.js.
 *
 * @param {string} url - absolute URL, built from conf/apiRoutes (makeUrl for query params)
 * @returns {Promise<unknown>} parsed JSON body, or null on 204
 */
export const apiGet = async url => {
  const response = await fetch(url, { headers: authHeaders() });
  await checkAndGetStatus(response);
  if (response.status === 204) return null;
  return response.json();
};

// Write verbs (apiPost/apiPut/apiPatch/apiDelete) land with the mutation phase.
// They are not added ahead of a caller: an untested wrapper nobody imports is
// the kind of dead code this migration is meant to remove, not create.
//
// Expected shape when the first mutation lands — sketch, not code, to keep the
// first caller aligned with apiGet's conventions:
//
//   export const apiPost = async (url, body) => {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json', ...authHeaders() },
//       body: JSON.stringify(body)
//     });
//     await checkAndGetStatus(response);
//     if (response.status === 204) return null;
//     return response.json();
//   };
//
// Same auth header discipline as apiGet (read at call time, never captured),
// same checkAndGetStatus so the QueryClient's global onError sees the same
// `body`/`status` shape whether the failure came from a query or a mutation.
