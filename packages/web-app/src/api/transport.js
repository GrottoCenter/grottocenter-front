import { API_URL } from '@/conf/apiRoutes';
import { getSessionTraceId } from './sessionTraceId';

// Transport only: callers retain their own authentication, parsing and errors.
// Dynamic file URLs can point outside the API, so compare normalized origins
// rather than trusting callers or matching hostname prefixes.
export const fetchWithTrace = (input, options) => {
  const url = input instanceof Request ? input.url : input;
  if (
    !API_URL ||
    new URL(url, window.location.href).origin !==
      new URL(API_URL, window.location.href).origin
  ) {
    return fetch(input, options);
  }

  const headers = new Headers(
    options?.headers ?? (input instanceof Request ? input.headers : undefined)
  );
  headers.set('X-Trace-Id', getSessionTraceId());
  // Fetch forwards custom headers on cross-origin redirects. API endpoints
  // must answer directly so a redirect cannot leak the visit id to a file host.
  return fetch(input, { ...options, headers, redirect: 'error' });
};
