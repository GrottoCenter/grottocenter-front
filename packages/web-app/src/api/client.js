import fetch from 'isomorphic-fetch';

import store from '../store';
import { checkAndGetStatus } from '../actions/utils';

// Thin fetch wrapper for React Query's queryFn/mutationFn. Deliberately reuses
// the existing conventions instead of inventing new ones: checkAndGetStatus
// attaches `body` and `status` to the thrown error, which is what the global
// error handler in conf/queryClient.js reads, and what the AGENTS.md error
// contract describes.
//
// The auth header is read from the store at call time, never captured at module
// scope: a query mounted before login must still send the header once the
// session exists.
const authHeaders = () => store.getState().login.authorizationHeader ?? {};

const jsonHeaders = () => ({
  'Content-Type': 'application/json',
  ...authHeaders()
});

const parseJsonOr204 = async response => {
  if (response.status === 204) return null;
  return response.json();
};

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
  return parseJsonOr204(response);
};

/**
 * GET a JSON resource and return both body and the Content-Range header.
 * Used by paginated lists whose total count lives in the response header
 * (notifications, documents queue, …).
 */
export const apiGetWithRange = async url => {
  const response = await fetch(url, { headers: authHeaders() });
  await checkAndGetStatus(response);
  const contentRange = response.headers.get('Content-Range');
  const data = await parseJsonOr204(response);
  return { data, contentRange };
};

const send = method => async (url, body) => {
  const init = {
    method,
    headers: body != null ? jsonHeaders() : authHeaders()
  };
  if (body != null) init.body = JSON.stringify(body);
  const response = await fetch(url, init);
  await checkAndGetStatus(response);
  return parseJsonOr204(response);
};

/**
 * POST a JSON body and return the parsed response.
 *
 * Same conventions as apiGet: auth header read at call time, errors thrown
 * with `body`/`status` attached so the QueryClient's onError sees the same
 * shape whether the failure came from a query or a mutation.
 */
export const apiPost = send('POST');

/** PUT a JSON body. */
export const apiPut = send('PUT');

/** PATCH a JSON body. */
export const apiPatch = send('PATCH');

/**
 * DELETE a resource. Body is optional — some deletes carry a reason payload,
 * most do not.
 */
export const apiDelete = send('DELETE');

// Multipart FormData sends. The browser must set Content-Type itself so the
// multipart boundary is included — never merge jsonHeaders() here.
const sendFormData = method => async (url, formData) => {
  const response = await fetch(url, {
    method,
    body: formData,
    headers: authHeaders()
  });
  await checkAndGetStatus(response);
  return parseJsonOr204(response);
};

/**
 * POST a multipart FormData payload (file uploads, document submissions).
 * Same error contract as apiPost — throws with body/status attached.
 */
export const apiPostForm = sendFormData('POST');

/** PUT a multipart FormData payload. */
export const apiPutForm = sendFormData('PUT');
