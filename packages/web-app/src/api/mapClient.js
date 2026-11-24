import store from '@/store';
import { apiFetch } from './client';

const MINUTE = 60000;

export const getMapRateLimitMinutes = limit =>
  Math.max(1, Math.ceil(((limit?.retryAt ?? 0) - Date.now()) / MINUTE));

const getMapRateLimitDeadline = value => {
  const now = Date.now();
  const fallback = { retryAt: now + 10 * MINUTE };
  const text = value?.trim();
  if (!text) return fallback;
  const seconds = Number(text);
  const deadline = Number.isFinite(seconds)
    ? now + seconds * 1000
    : Date.parse(text);
  if (!Number.isFinite(deadline) || seconds < 0) return fallback;
  return { retryAt: Math.max(now + 1000, deadline) };
};

// The API's general quota is shared by IP across all geoloc endpoints. Keep
// this deadline across map mounts and logout. A new session can try the higher
// authenticated quota. Retry-After is exposed through CORS; the full 10-minute
// quota window is only a fallback for missing or invalid headers.
let rateLimit = null;
let episode = 0;
let announcedEpisode = 0;
let updateTimer = null;
const listeners = new Set();

// One timer drives both the remaining-minute display and recovery at expiry.
const notifyMapRateLimit = () => {
  clearTimeout(updateTimer);
  const remaining = rateLimit.retryAt - Date.now();
  updateTimer =
    remaining > 0
      ? setTimeout(
          () => {
            // Keep the episode so dismissal survives ticks and expiry closes it.
            rateLimit = { ...rateLimit };
            notifyMapRateLimit();
          },
          remaining % MINUTE || MINUTE
        )
      : null;
  listeners.forEach(listener => listener());
};

export const getMapRateLimit = () => rateLimit;

export const subscribeMapRateLimit = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const resumeMapAfterLogin = () => {
  if (!rateLimit || rateLimit.retryAt <= Date.now()) return;
  rateLimit = { ...rateLimit, retryAt: Date.now() };
  notifyMapRateLimit();
};

export const recordMapRateLimit = deadline => {
  if (!Number.isFinite(deadline?.retryAt) || deadline.retryAt <= Date.now())
    return;
  const isActive = rateLimit?.retryAt > Date.now();
  if (isActive && rateLimit.retryAt >= deadline.retryAt) return;
  if (!isActive) episode += 1;
  rateLimit = { ...deadline, episode };
  notifyMapRateLimit();
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
  clearTimeout(updateTimer);
  updateTimer = null;
  rateLimit = null;
  episode = 0;
  announcedEpisode = 0;
};
