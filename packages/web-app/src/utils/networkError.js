// Tells a "the network never answered" failure apart from a real server
// response, so the UI can say "not available offline" instead of showing a red
// error for data that exists and is simply out of reach.

// Wording differs across engines for the very same failure:
// Chrome "Failed to fetch", Firefox "NetworkError when attempting to fetch
// resource.", Safari "Load failed", React Native / some WebViews "Network
// request failed".
const NETWORK_MESSAGE =
  /failed to fetch|networkerror|load failed|network request failed/i;

/**
 * @param {*} error - any of the error shapes this app stores in Redux:
 *   - a raw Error/TypeError (thunks like actions/Entrance/GetEntrance.js)
 *   - makeErrorMessage() output `{ type, message }`, where `type` holds the
 *     ORIGINAL error message and `message` the context label
 *   - the structured API shape `{ code, message, details, status }`
 * @returns {boolean}
 */
export const isNetworkError = error => {
  if (!error) return false;

  // A few reducers store the bare message string rather than an object
  // (see components/appli/Region: `error: oneOfType([string, object])`).
  if (typeof error === 'string') return NETWORK_MESSAGE.test(error);

  // A numeric status means an HTTP response came back — 404, 500, whatever.
  // This check must come first and win outright: a 404 fetched before losing
  // connectivity is still a 404 while offline, and mislabelling it "not
  // available offline" would send the user looking for a network problem that
  // doesn't exist.
  if (typeof error.status === 'number') return false;

  if (
    NETWORK_MESSAGE.test(error.message ?? '') ||
    NETWORK_MESSAGE.test(error.type ?? '')
  ) {
    return true;
  }

  // Last resort for error shapes we don't recognise: if the browser says we're
  // offline, a failure with no HTTP status almost certainly comes from that.
  // Intentional catch-all — an unknown error shape (e.g. a bare string from
  // an unrelated middleware) will be flagged as a network error when offline.
  // False positives on the tail end are preferable to showing a red error for
  // data the user simply cannot reach.
  return typeof navigator !== 'undefined' && navigator.onLine === false;
};

export default isNetworkError;
