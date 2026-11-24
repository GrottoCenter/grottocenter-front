import store from '@/store';
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
// this deadline across map mounts and logout. A new session can try the higher
// authenticated quota. CORS currently hides Retry-After in production, so
// fall back to the full 10-minute quota window.
let rateLimit = null;
let episode = 0;
let announcedEpisode = 0;
let expiryTimer = null;
const listeners = new Set();

const scheduleExpiry = () => {
  clearTimeout(expiryTimer);
  const remaining = rateLimit.retryAt - Date.now();
  if (remaining > 0) {
    // Long server deadlines must not overflow the browser's timer range.
    expiryTimer = setTimeout(scheduleExpiry, Math.min(remaining, 2147483647));
    return;
  }
  expiryTimer = null;
  // Retain the episode so the notifier can close its existing snackbar.
  rateLimit = { ...rateLimit };
  listeners.forEach(listener => listener());
};

export const getMapRateLimit = () => rateLimit;

export const subscribeMapRateLimit = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const resumeMapAfterLogin = () => {
  if (!rateLimit || rateLimit.retryAt <= Date.now()) return;
  clearTimeout(expiryTimer);
  expiryTimer = null;
  rateLimit = { ...rateLimit, retryAt: Date.now() };
  listeners.forEach(listener => listener());
};

export const recordMapRateLimit = deadline => {
  if (!Number.isFinite(deadline?.retryAt) || deadline.retryAt <= Date.now())
    return;
  const isActive = rateLimit?.retryAt > Date.now();
  if (isActive && rateLimit.retryAt >= deadline.retryAt) return;
  if (!isActive) episode += 1;
  rateLimit = { ...deadline, episode };
  scheduleExpiry();
  listeners.forEach(listener => listener());
};

// Installed by the application shell. Session and worker events belong to the
// transport lifecycle; displaying or dismissing a toast must not control them.
export const observeMapRateLimit = () => {
  const getAuthorization = () =>
    store.getState().login.authorizationHeader?.Authorization;
  let authorization = getAuthorization();
  const unsubscribe = store.subscribe(() => {
    const next = getAuthorization();
    const hasStartedSession = next && !authorization;
    // Update before notifying: recovery can dispatch map actions immediately.
    authorization = next;
    if (hasStartedSession) resumeMapAfterLogin();
  });
  const worker = navigator.serviceWorker;
  const handleMessage = event => {
    if (
      event.source !== worker.controller ||
      event.data?.type !== 'grottocenter-map-rate-limit' ||
      // Ignore visitor requests that completed after the session started.
      (authorization && !event.data.isAuthenticated)
    )
      return;
    recordMapRateLimit(getMapRateLimitDeadline(event.data.retryAfter));
  };
  worker?.addEventListener('message', handleMessage);
  return () => {
    unsubscribe();
    worker?.removeEventListener('message', handleMessage);
  };
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
  const wasAuthenticated = Boolean(
    store.getState().login.authorizationHeader?.Authorization
  );
  const response = await apiFetch(url, options);
  if (response.status === 429) {
    // Retry a late visitor 429 with the new session for every map caller.
    // The next call captures authenticated state, so a fresh 429 records a
    // pause normally; an already-active pause blocks the retry up front.
    if (
      !wasAuthenticated &&
      store.getState().login.authorizationHeader?.Authorization
    )
      return mapFetch(url, options);
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
  clearTimeout(expiryTimer);
  expiryTimer = null;
  rateLimit = null;
  episode = 0;
  announcedEpisode = 0;
};
