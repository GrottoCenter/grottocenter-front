import { act, render, screen } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import store from '@/store';
import { fetchLoginSuccess, logout } from '@/actions/Login';
import {
  observeMapRateLimit,
  recordMapRateLimit,
  isMapRateLimited,
  _resetForTests
} from '@/api/mapClient';
import { LOADINGS, refetchMapViewport } from '@/actions/Map';
import mapReducer from '@/reducers/Map';
import { useRefetchOnReconnect } from '@/hooks';

import MapPage from './Map';

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: vi.fn(),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams()]
}));
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn()
}));
vi.mock('@/actions/Map', async importOriginal => ({
  ...(await importOriginal()),
  refetchMapViewport: vi.fn()
}));
vi.mock('@/utils/organizationCache', () => ({
  subscribeOrganizationMapChanges: () => () => {}
}));
vi.mock('@/hooks/useGeolocation', () => ({
  default: () => ({ location: null, hasLocation: false })
}));
vi.mock('@/hooks/useGeolocationPermission', () => ({
  default: () => 'prompt'
}));
vi.mock('@/hooks', () => ({ useRefetchOnReconnect: vi.fn() }));
vi.mock('@/components/common/Maps/MapClusters', () => ({
  default: ({ onUpdate }) => (
    <button
      type="button"
      onClick={() =>
        onUpdate({
          markers: [],
          showMassifPolygons: true,
          zoom: 13,
          center: { lat: 45, lng: 6 },
          bounds: {
            _southWest: { wrap: () => ({ lat: 44, lng: 5 }) },
            _northEast: { wrap: () => ({ lat: 46, lng: 7 }) }
          }
        })
      }>
      Move map
    </button>
  )
}));

let navigate;
let mapStore;

beforeEach(() => {
  _resetForTests();
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  navigate = vi.fn();
  useNavigate.mockReturnValue(navigate);
  mapStore = configureStore({ reducer: { map: mapReducer } });
  useDispatch.mockReturnValue(mapStore.dispatch);
  useSelector.mockReturnValue([]);
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response('[]')))
  );
  window.history.replaceState(null, '', '/ui/map');
});

afterEach(() => {
  _resetForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

const moveMap = async () => {
  // Resolve the lazy map while retaining the real Map page and its debounce.
  await act(async () => {
    render(<MapPage />);
  });
  act(() => screen.getByRole('button', { name: 'Move map' }).click());
};

it.each([
  '/ui/map',
  '/ui/map/44,5,10',
  '/ui/map/',
  '/pr/1643/ui/map',
  '/pr/1643/ui/map/44,5,10'
])('updates the shareable URL after settling on %s', async pathname => {
  window.history.replaceState(null, '', pathname);
  await moveMap();
  act(() => vi.advanceTimersByTime(999));
  expect(navigate).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(navigate).toHaveBeenCalledExactlyOnceWith('/ui/map/45%2C6%2C13', {
    replace: true
  });
});

it.each([
  '/ui/entrances/1',
  '/ui/map-settings',
  '/ui/map/44,5,10/extra',
  '/pr/1643/ui/entrances/1',
  '/pr/1643/ui/map/44,5,10/extra'
])(
  'does not undo navigation to %s while the map is still mounted',
  async pathname => {
    await moveMap();
    window.history.pushState(null, '', pathname);
    act(() => vi.advanceTimersByTime(1000));
    expect(navigate).not.toHaveBeenCalled();
  }
);

it('cancels a pending URL update when the map unmounts', async () => {
  let view;
  await act(async () => {
    view = render(<MapPage />);
  });
  act(() => screen.getByRole('button', { name: 'Move map' }).click());
  view.unmount();
  act(() => vi.advanceTimersByTime(1000));
  expect(navigate).not.toHaveBeenCalled();
});

it('loads all four bulk datasets and retries the viewport after mounting during a pause', async () => {
  const fetchMock = vi
    .fn()
    .mockImplementation(() => Promise.resolve(new Response('[]')));
  vi.stubGlobal('fetch', fetchMock);
  const dispatch = vi.fn(mapStore.dispatch);
  useDispatch.mockReturnValue(dispatch);
  recordMapRateLimit({ retryAt: Date.now() + 5000 });
  await act(async () => render(<MapPage />));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(refetchMapViewport).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(4999));
  expect(fetchMock).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(refetchMapViewport).toHaveBeenCalledTimes(1);
  expect(Object.keys(mapStore.getState().map.loadedCoordinates)).toHaveLength(
    4
  );
  await act(() => vi.advanceTimersByTimeAsync(60000));
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it('does not reload an unmounted map when the pause expires', async () => {
  recordMapRateLimit({ retryAt: Date.now() + 5000 });
  const view = render(<MapPage />);
  view.unmount();
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(refetchMapViewport).not.toHaveBeenCalled();
});

it('resumes visible massif polygons along with the bulk datasets', async () => {
  const fetchMock = vi
    .fn()
    .mockImplementation(() => Promise.resolve(new Response('[]')));
  vi.stubGlobal('fetch', fetchMock);
  recordMapRateLimit({ retryAt: Date.now() + 5000 });
  await moveMap();
  await act(() => vi.advanceTimersByTimeAsync(4999));
  expect(fetchMock).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(fetchMock).toHaveBeenCalledTimes(5);
  expect(
    fetchMock.mock.calls.some(([url]) =>
      new URL(url).pathname.endsWith('/massifs')
    )
  ).toBe(true);
});

it.each([
  ['expiry', []],
  ['expiry', [[6, 45]]],
  ['login', []],
  ['login', [[6, 45]]]
])(
  'preserves successful bulk loads on %s recovery with response %j',
  async (recovery, coordinates) => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(coordinates)))
    );
    store.dispatch(logout());
    const stopMonitoring = observeMapRateLimit();
    try {
      await moveMap();
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(fetch).toHaveBeenCalledTimes(5);
      vi.mocked(fetch).mockClear();

      act(() => recordMapRateLimit({ retryAt: Date.now() + 5000 }));
      if (recovery === 'login') {
        await act(async () => {
          store.dispatch(fetchLoginSuccess({ id: 1 }, 'session'));
        });
      } else {
        await act(() => vi.advanceTimersByTimeAsync(5000));
      }
      expect(refetchMapViewport).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(new URL(fetch.mock.calls[0][0]).pathname).toMatch(/\/massifs$/);
    } finally {
      stopMonitoring();
      store.dispatch(logout());
    }
  }
);

it('retries only a failed bulk dataset while preserving the successful ones', async () => {
  vi.mocked(fetch).mockImplementation(url =>
    Promise.resolve(
      String(url).includes('/entrancesCoordinates')
        ? new Response(null, { status: 429, headers: { 'Retry-After': '5' } })
        : new Response('[]')
    )
  );
  await act(async () => render(<MapPage />));
  expect(fetch).toHaveBeenCalledTimes(4);
  vi.mocked(fetch).mockClear();
  vi.mocked(fetch).mockImplementation(() =>
    Promise.resolve(new Response('[]'))
  );
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(new URL(fetch.mock.calls[0][0]).pathname).toMatch(
    /\/entrancesCoordinates$/
  );
  expect(refetchMapViewport).toHaveBeenCalledTimes(1);
});

describe.each([
  ['entrancesCoordinates', LOADINGS.ENTRANCES_COORDINATES],
  ['networksCoordinates', LOADINGS.NETWORKS_COORDINATES],
  ['massifsCoordinates', LOADINGS.MASSIFS_COORDINATES],
  ['organizations', LOADINGS.ORGANIZATIONS_COORDINATES]
])('login with pending %s', (endpoint, loadingKey) => {
  it.each([200, 429])(
    'retries a late visitor 429 once and handles an authenticated HTTP %i',
    async status => {
      let finishVisitorRequest;
      const pending = new Promise(resolve => {
        finishVisitorRequest = resolve;
      });
      let endpointCalls = 0;
      vi.mocked(fetch).mockImplementation(url => {
        if (new URL(url).pathname.endsWith(`/${endpoint}`)) {
          endpointCalls += 1;
          if (endpointCalls === 1) return pending;
          if (endpointCalls === 2 && status === 429)
            return Promise.resolve(
              new Response(null, {
                status: 429,
                headers: { 'Retry-After': '5' }
              })
            );
        }
        return Promise.resolve(new Response('[]'));
      });
      store.dispatch(logout());
      const stopMonitoring = observeMapRateLimit();
      try {
        await act(async () => render(<MapPage />));
        expect(fetch).toHaveBeenCalledTimes(4);
        expect(
          Object.keys(mapStore.getState().map.loadedCoordinates)
        ).toHaveLength(3);
        expect(mapStore.getState().map.loadings[loadingKey]).toBe(true);

        act(() => recordMapRateLimit({ retryAt: Date.now() + 600000 }));
        await act(async () => {
          store.dispatch(fetchLoginSuccess({ id: 1 }, 'session'));
        });
        // Login preserves successful datasets and lets the pending request finish.
        expect(fetch).toHaveBeenCalledTimes(4);
        expect(refetchMapViewport).toHaveBeenCalledTimes(1);
        await act(async () => {
          finishVisitorRequest(new Response(null, { status: 429 }));
        });
        expect(fetch).toHaveBeenCalledTimes(5);
        expect(endpointCalls).toBe(2);
        expect(fetch.mock.lastCall[1].headers.get('Authorization')).toBe(
          'Bearer session'
        );
        expect(mapStore.getState().map.loadings[loadingKey]).toBe(false);
        expect(isMapRateLimited()).toBe(status === 429);

        if (status === 429) {
          expect(
            mapStore.getState().map.loadedCoordinates[loadingKey]
          ).toBeUndefined();
          await act(() => vi.advanceTimersByTimeAsync(4999));
          expect(endpointCalls).toBe(2);
          await act(() => vi.advanceTimersByTimeAsync(1));
          expect(endpointCalls).toBe(3);
          expect(fetch).toHaveBeenCalledTimes(6);
        }
        expect(mapStore.getState().map.loadedCoordinates[loadingKey]).toBe(
          true
        );
        expect(
          Object.keys(mapStore.getState().map.loadedCoordinates)
        ).toHaveLength(4);
      } finally {
        stopMonitoring();
        store.dispatch(logout());
      }
    }
  );
});

it('still refreshes all bulk datasets on network reconnection', async () => {
  await act(async () => render(<MapPage />));
  vi.mocked(fetch).mockClear();
  const [reloadMap] = useRefetchOnReconnect.mock.lastCall;
  await act(async () => reloadMap());
  expect(fetch).toHaveBeenCalledTimes(4);
  expect(refetchMapViewport).toHaveBeenCalledTimes(1);
});
