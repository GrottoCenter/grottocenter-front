import { waitFor } from '@testing-library/react';
import store from '@/store';
import { fetchLoginSuccess, logout } from '@/actions/Login';
import {
  fetchAllEntrancesCoordinates,
  fetchAllNetworksCoordinates,
  fetchAllOrganizationsCoordinates,
  fetchAllMassifsCoordinates,
  fetchMassifs,
  fetchEntrances,
  fetchNetworks,
  fetchOrganizations
} from './Map';

afterEach(() => {
  store.dispatch(logout());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  ['entrance coordinates', fetchAllEntrancesCoordinates],
  ['network coordinates', fetchAllNetworksCoordinates],
  ['organization coordinates', fetchAllOrganizationsCoordinates],
  ['massif coordinates', fetchAllMassifsCoordinates],
  ['massif polygons', fetchMassifs],
  ['entrance tiles', fetchEntrances],
  ['network tiles', fetchNetworks],
  ['organization tiles', fetchOrganizations]
])('uses the current session for %s', async (_label, action) => {
  const fetchMock = vi.fn().mockResolvedValue({
    status: 200,
    text: async () => '[]'
  });
  vi.stubGlobal('fetch', fetchMock);

  for (const [index, token] of [null, 'first', 'second', null].entries()) {
    if (token) store.dispatch(fetchLoginSuccess({ id: 1 }, token));
    else store.dispatch(logout());
    const before = fetchMock.mock.calls.length;
    // Move far enough for each session to request uncached tiles.
    // Session changes must run in order against the same live store.
    // eslint-disable-next-line no-await-in-loop
    await store.dispatch(
      action({
        sw_lat: 45.5,
        ne_lat: 45.50001,
        sw_lng: 6.5 + index,
        ne_lng: 6.50001 + index,
        zoom: 13
      })
    );
    // Wait for this session's requests before applying the next transition.
    // eslint-disable-next-line no-await-in-loop
    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBeGreaterThan(before)
    );
    fetchMock.mock.calls.slice(before).forEach(([, options]) => {
      expect(new Headers(options.headers).get('Authorization')).toBe(
        token ? `Bearer ${token}` : null
      );
    });
  }
});

it('reads the session again on each coordinate retry', async () => {
  vi.useFakeTimers();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ status: 503 })
    .mockResolvedValueOnce({ status: 503 })
    .mockResolvedValue({ status: 200, text: async () => '[]' });
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  try {
    store.dispatch(fetchLoginSuccess({ id: 1 }, 'first'));
    const request = store.dispatch(fetchAllNetworksCoordinates());
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe(
      'Bearer first'
    );
    store.dispatch(fetchLoginSuccess({ id: 1 }, 'second'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock.mock.calls[1][1].headers.get('Authorization')).toBe(
      'Bearer second'
    );
    store.dispatch(logout());
    await vi.advanceTimersByTimeAsync(2000);
    await request;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1].headers.has('Authorization')).toBe(false);
  } finally {
    vi.useRealTimers();
  }
});
