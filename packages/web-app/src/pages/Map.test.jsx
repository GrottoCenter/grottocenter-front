import { act, render, screen } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

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
vi.mock('@/actions/Map', () => ({
  fetchAllEntrancesCoordinates: vi.fn(),
  fetchAllNetworksCoordinates: vi.fn(),
  fetchAllMassifsCoordinates: vi.fn(),
  fetchAllOrganizationsCoordinates: vi.fn()
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
          showMassifPolygons: false,
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
  vi.useFakeTimers();
  navigate = vi.fn();
  useNavigate.mockReturnValue(navigate);
  useDispatch.mockReturnValue(vi.fn());
  useSelector.mockReturnValue([]);
  window.history.replaceState(null, '', '/ui/map');
});

afterEach(() => {
  vi.useRealTimers();
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

it.each(['/ui/map', '/ui/map/44,5,10', '/ui/map/'])(
  'updates the shareable URL after settling on %s',
  async pathname => {
    window.history.replaceState(null, '', pathname);
    await moveMap();
    act(() => vi.advanceTimersByTime(999));
    expect(navigate).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/ui/map/45%2C6%2C13', {
      replace: true
    });
  }
);

it.each(['/ui/entrances/1', '/ui/map-settings', '/ui/map/44,5,10/extra'])(
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
