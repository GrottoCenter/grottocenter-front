import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import store from '@/store';
import { fetchLoginSuccess, logout } from '@/actions/Login';
import {
  ADVANCED_SEARCH_TYPES,
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  NOMINATIM_API_URL
} from '@/conf/config';
import GeocodingControl from './GeocodingControl';

const { map, projections } = vi.hoisted(() => ({
  map: {
    getBounds: () => ({
      getWest: () => 6,
      getEast: () => 7,
      getSouth: () => 45,
      getNorth: () => 46
    })
  },
  projections: []
}));
vi.mock('react-leaflet', () => ({ useMap: () => map }));
vi.mock('@/hooks', () => ({ useProjections: () => projections }));
vi.mock('./Markers/useRenderPopup', () => ({ default: () => () => null }));
vi.mock('./Markers/Components', () => ({
  CoordinatesMarker: {},
  EntrancePopup: () => null,
  NetworkPopup: () => null,
  MassifPopup: () => null,
  OrganizationPopup: () => null
}));

const detail = {
  entrances: [
    { latitude: 45.5, longitude: 6.5 },
    { latitude: 45.6, longitude: 6.6 }
  ],
  geogPolygon: {
    type: 'Polygon',
    coordinates: [
      [
        [6, 45],
        [7, 45],
        [7, 46],
        [6, 45]
      ]
    ]
  }
};

const renderSearch = () =>
  render(
    <IntlProvider
      locale="en"
      messages={{ 'Search on map...': 'Search on map...' }}>
      <GeocodingControl />
    </IntlProvider>
  );

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  store.dispatch(logout());
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('authenticates all search requests and enrichment, never Nominatim', async () => {
  const fetchMock = vi.fn((url, options) => {
    let data = detail;
    if (url.startsWith(NOMINATIM_API_URL)) data = [];
    else if (options.method === 'POST') {
      const { entity } = JSON.parse(options.body);
      const isEnriched = [
        ADVANCED_SEARCH_TYPES.CAVES,
        ADVANCED_SEARCH_TYPES.MASSIFS
      ].includes(entity);
      data = { results: isEnriched ? [{ id: 1, name: 'Result' }] : [] };
    }
    return Promise.resolve({ json: async () => data });
  });
  vi.stubGlobal('fetch', fetchMock);
  renderSearch();
  for (const [index, token] of [null, 'first', 'second', null].entries()) {
    if (token) store.dispatch(fetchLoginSuccess({ id: 1 }, token));
    else store.dispatch(logout());
    const before = fetchMock.mock.calls.length;
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: `grottes${index}` }
    });
    // Finish each search before changing session on the mounted control.
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOCOMPLETE_DEBOUNCE_DELAY);
    });
    const calls = fetchMock.mock.calls.slice(before);
    expect(calls).toHaveLength(8);
    calls.forEach(([url, options]) => {
      const headers = new Headers(options.headers);
      expect(headers.get('Authorization')).toBe(
        token && !url.startsWith(NOMINATIM_API_URL) ? `Bearer ${token}` : null
      );
      expect(options.signal.aborted).toBe(false);
      if (options.method === 'POST') {
        expect(headers.get('Content-Type')).toBe('application/json');
      }
    });
  }
});

it('aborts searches superseded by input changes and unmounting', async () => {
  const fetchMock = vi.fn(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError'))
        );
      })
  );
  vi.stubGlobal('fetch', fetchMock);
  const { unmount } = renderSearch();
  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: 'grottes' }
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTOCOMPLETE_DEBOUNCE_DELAY);
  });
  expect(fetchMock).toHaveBeenCalledTimes(5);
  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: 'cavernes' }
  });
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTOCOMPLETE_DEBOUNCE_DELAY);
  });
  expect(fetchMock).toHaveBeenCalledTimes(10);
  unmount();
  await act(async () => {});
  fetchMock.mock.calls.forEach(([, { signal }]) => {
    expect(signal.aborted).toBe(true);
  });
});
