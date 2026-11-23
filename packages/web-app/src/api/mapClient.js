import { apiFetch } from './client';

const getMapRateLimitDeadline = value => {
  const now = Date.now();
  const fallback = { retryAt: now + 10 * 60 * 1000, hasServerDeadline: false };
  const text = value?.trim();
  if (!text) return fallback;
  const seconds = Number(text);
  const deadline = Number.isFinite(seconds)
    ? now + seconds * 1000
    : Date.parse(text);
  if (!Number.isFinite(deadline) || seconds < 0) return fallback;
  return { retryAt: Math.max(now + 1000, deadline), hasServerDeadline: true };
};

// The API's general quota is shared by IP across all geoloc endpoints. Keep
// this deadline across map mounts and session changes. CORS currently hides
// Retry-After in production, so fall back to the full 10-minute quota window.
let rateLimit = null;
let episode = 0;
let announcedEpisode = 0;
const listeners = new Set();

export const getMapRateLimit = () => rateLimit;

export const subscribeMapRateLimit = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const recordMapRateLimit = deadline => {
  if (!Number.isFinite(deadline?.retryAt) || deadline.retryAt <= Date.now())
    return;
  const isActive = rateLimit?.retryAt > Date.now();
  if (isActive && rateLimit.retryAt >= deadline.retryAt) return;
  if (!isActive) episode += 1;
  rateLimit = { ...deadline, episode };
  listeners.forEach(listener => listener());
};

// Claim before enqueueing: dismissal, StrictMode and remounts must not repeat
// the warning. The rendered snackbar follows auth/locale changes on its own.
export const claimMapRateLimitWarning = () => {
  if (!rateLimit || announcedEpisode === rateLimit.episode) return false;
  announcedEpisode = rateLimit.episode;
  return true;
};

export const isMapRateLimited = () =>
  // Offline requests must still reach the service worker's cached map data.
  !(typeof navigator !== 'undefined' && navigator.onLine === false) &&
  Date.now() < (rateLimit?.retryAt ?? 0);

export const mapFetch = async (url, options) => {
  if (isMapRateLimited()) {
    const error = new Error('429');
    error.status = 429;
    throw error;
  }
  const response = await apiFetch(url, options);
  if (response.status === 429) {
    // Other requests may already be in flight: their responses can extend the
    // pause, but a shorter delay or a success must never cancel an active one.
    recordMapRateLimit(
      getMapRateLimitDeadline(response.headers?.get('Retry-After'))
    );
  }
  return response;
};

// Test-only reset of the shared deadline.
export const _resetForTests = () => {
  rateLimit = null;
  episode = 0;
  announcedEpisode = 0;
};
