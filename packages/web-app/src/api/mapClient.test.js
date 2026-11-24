import store from '@/store';
import { fetchLoginSuccess, logout } from '@/actions/Login';
import {
  mapFetch,
  isMapRateLimited,
  getMapRateLimit,
  getMapRateLimitMinutes,
  recordMapRateLimit,
  subscribeMapRateLimit,
  observeMapRateLimit,
  _resetForTests
} from './mapClient';

const NOW = Date.UTC(2026, 10, 23, 12);
let clock;
let fetchMock;
let stopMonitoring;

beforeEach(() => {
  _resetForTests();
  store.dispatch(logout());
  clock = vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  stopMonitoring?.();
  stopMonitoring = null;
  store.dispatch(logout());
  _resetForTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  [null, 1],
  [{ retryAt: NOW - 1000 }, 1],
  [{ retryAt: NOW }, 1],
  [{ retryAt: NOW + 1 }, 1],
  [{ retryAt: NOW + 60000 }, 1],
  [{ retryAt: NOW + 60001 }, 2],
  [{ retryAt: NOW + 125000 }, 3]
])('rounds the remaining minutes for %j to %i', (limit, minutes) => {
  expect(getMapRateLimitMinutes(limit)).toBe(minutes);
});

it.each([200, 429])(
  'retries a late visitor 429 with the same options and handles authenticated HTTP %i',
  async status => {
    stopMonitoring = observeMapRateLimit();
    let finish;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const response = new Response('[]', { status });
    fetchMock.mockResolvedValueOnce(response);
    const url = '/api/v1/geoloc/networks';
    const options = {
      signal: new AbortController().signal,
      headers: { 'X-Request-Id': 'map-test' }
    };
    const pending = mapFetch(url, options);
    recordMapRateLimit({ retryAt: NOW + 600000 });
    store.dispatch(fetchLoginSuccess({ id: 1 }, 'session'));
    expect(isMapRateLimited()).toBe(false);
    finish(new Response(null, { status: 429 }));
    expect(await pending).toBe(response);
    expect(response.bodyUsed).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers.has('Authorization')).toBe(false);
    const [retryUrl, retryOptions] = fetchMock.mock.lastCall;
    expect(retryUrl).toBe(url);
    expect(retryOptions.signal).toBe(options.signal);
    expect(retryOptions.headers.get('X-Request-Id')).toBe('map-test');
    expect(retryOptions.headers.get('Authorization')).toBe('Bearer session');
    expect(isMapRateLimited()).toBe(status === 429);
    store.dispatch(logout());
    expect(isMapRateLimited()).toBe(status === 429);
  }
);

it('does not retry a late visitor 429 during a new authenticated pause', async () => {
  let finish;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  const pending = mapFetch('/api/v1/geoloc/networks');
  store.dispatch(fetchLoginSuccess({ id: 1 }, 'session'));
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
  await mapFetch('/api/v1/geoloc/entrances');
  expect(isMapRateLimited()).toBe(true);
  finish(new Response(null, { status: 429 }));
  await expect(pending).rejects.toMatchObject({ status: 429 });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(isMapRateLimited()).toBe(true);
});

it('adopts background 429s only from the controlling worker and ignores late visitor messages after login', () => {
  const worker = new EventTarget();
  const controller = {};
  worker.controller = controller;
  vi.stubGlobal('navigator', { serviceWorker: worker, onLine: true });
  stopMonitoring = observeMapRateLimit();
  const data = {
    type: 'grottocenter-map-rate-limit',
    retryAfter: '120',
    isAuthenticated: false
  };
  worker.dispatchEvent(new MessageEvent('message', { data }));
  expect(isMapRateLimited()).toBe(false);
  worker.dispatchEvent(
    new MessageEvent('message', { data, source: controller })
  );
  expect(isMapRateLimited()).toBe(true);
  clock.mockReturnValue(NOW + 120000);
  expect(isMapRateLimited()).toBe(false);
  store.dispatch(fetchLoginSuccess({ id: 1 }, 'session'));
  worker.dispatchEvent(
    new MessageEvent('message', { data, source: controller })
  );
  expect(isMapRateLimited()).toBe(false);
  const authenticated = { ...data, isAuthenticated: true };
  worker.dispatchEvent(
    new MessageEvent('message', { data: authenticated, source: controller })
  );
  expect(isMapRateLimited()).toBe(true);
  stopMonitoring();
  _resetForTests();
  worker.dispatchEvent(
    new MessageEvent('message', { data: authenticated, source: controller })
  );
  expect(isMapRateLimited()).toBe(false);
});

it.each([
  ['120', 120000],
  [new Date(NOW + 90000).toUTCString(), 90000],
  ['0', 1000],
  [new Date(NOW - 1000).toUTCString(), 1000],
  [null, 600000],
  ['', 600000],
  ['invalid', 600000],
  ['-1', 600000]
])('pauses all map endpoints for Retry-After %s', async (value, delay) => {
  const response = new Response('Too many requests', {
    status: 429,
    headers: value === null ? {} : { 'Retry-After': value }
  });
  fetchMock.mockResolvedValueOnce(response);
  fetchMock.mockResolvedValue(new Response('[]'));

  expect(await mapFetch('/api/v1/geoloc/entrances')).toBe(response);
  expect(response.bodyUsed).toBe(false);
  clock.mockReturnValue(NOW + delay - 1);
  await expect(mapFetch('/api/v1/geoloc/massifs')).rejects.toMatchObject({
    message: '429',
    status: 429
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);

  clock.mockReturnValue(NOW + delay);
  await mapFetch('/api/v1/geoloc/massifs');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(isMapRateLimited()).toBe(false);
});

it.each([200, 503])('does not pause the map on HTTP %i', async status => {
  fetchMock.mockResolvedValue(new Response('[]', { status }));
  await mapFetch('/api/v1/geoloc/entrances');
  await mapFetch('/api/v1/geoloc/networks');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(isMapRateLimited()).toBe(false);
});

it('announces expiry once at the extended deadline and supports unsubscribe', () => {
  clock.mockRestore();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  const listener = vi.fn();
  const unsubscribe = subscribeMapRateLimit(listener);
  try {
    recordMapRateLimit({ retryAt: NOW + 5000 });
    vi.advanceTimersByTime(1000);
    recordMapRateLimit({ retryAt: NOW + 10000 });
    recordMapRateLimit({ retryAt: NOW + 6000 });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(4000);
    expect(listener).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(5000);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(isMapRateLimited()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    unsubscribe();
    recordMapRateLimit({ retryAt: Date.now() + 1000 });
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(3);
  } finally {
    unsubscribe();
    _resetForTests();
    vi.useRealTimers();
  }
});

it('publishes remaining-minute changes and expiry with a single shared timer', () => {
  clock.mockRestore();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  const listener = vi.fn(() => getMapRateLimitMinutes(getMapRateLimit()));
  const unsubscribe = subscribeMapRateLimit(listener);
  try {
    recordMapRateLimit({ retryAt: NOW + 125000 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(4999);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(listener).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(60000);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(60000);
    expect(listener).toHaveBeenCalledTimes(4);
    expect(listener.mock.results.map(result => result.value)).toEqual([
      3, 2, 1, 1
    ]);
    expect(isMapRateLimited()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    unsubscribe();
    _resetForTests();
    vi.useRealTimers();
  }
});

it('keeps offline cache access available without lifting the online pause', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
  await mapFetch('/api/v1/geoloc/entrances');

  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const cached = new Response('[]');
  fetchMock.mockResolvedValueOnce(cached);
  expect(await mapFetch('/api/v1/geoloc/entrances')).toBe(cached);

  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await expect(mapFetch('/api/v1/geoloc/networks')).rejects.toMatchObject({
    status: 429
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it.each([200, 429])(
  'does not shorten a pause when an in-flight request returns HTTP %i',
  async status => {
    let finish;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const pending = mapFetch('/api/v1/geoloc/networks');
    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { 'Retry-After': '120' } })
    );
    await mapFetch('/api/v1/geoloc/entrances');
    finish(new Response(null, { status, headers: { 'Retry-After': '1' } }));
    await pending;
    clock.mockReturnValue(NOW + 30000);
    expect(isMapRateLimited()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  }
);
