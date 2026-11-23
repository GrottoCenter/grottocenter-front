import { act, render, screen } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { recordMapRateLimit, _resetForTests } from '@/api/mapClient';
import { refetchMapViewport } from '@/actions/Map';

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

beforeEach(() => {
  _resetForTests();
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  navigate = vi.fn();
  useNavigate.mockReturnValue(navigate);
  useDispatch.mockReturnValue(vi.fn());
  useSelector.mockReturnValue([]);
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
  const dispatch = vi.fn(action =>
    typeof action === 'function' ? action(dispatch) : action
  );
  useDispatch.mockReturnValue(dispatch);
  recordMapRateLimit({ retryAt: Date.now() + 5000, hasServerDeadline: true });
  await act(async () => render(<MapPage />));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(refetchMapViewport).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(4999));
  expect(fetchMock).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(refetchMapViewport).toHaveBeenCalledTimes(1);
  const successfulLoads = dispatch.mock.calls
    .map(([action]) => action.type)
    .filter(type => type?.endsWith('_COORDINATES_SUCCESS'));
  expect(successfulLoads).toHaveLength(4);
  await act(() => vi.advanceTimersByTimeAsync(60000));
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it('does not reload an unmounted map when the pause expires', async () => {
  recordMapRateLimit({ retryAt: Date.now() + 5000, hasServerDeadline: true });
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
  const dispatch = vi.fn(action =>
    typeof action === 'function' ? action(dispatch) : action
  );
  useDispatch.mockReturnValue(dispatch);
  recordMapRateLimit({ retryAt: Date.now() + 5000, hasServerDeadline: true });
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
