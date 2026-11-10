import { cleanup, render, waitFor } from '@testing-library/react';
import store from '@/store';
import { fetchLoginSuccess, logout } from '@/actions/Login';
import queryClient from '@/conf/queryClient';
import PopupTargetHandler from './PopupTargetHandler';

const { map } = vi.hoisted(() => ({ map: { openPopup: vi.fn() } }));
vi.mock('react-leaflet', () => ({ useMap: () => map }));
vi.mock('../common/Markers/useRenderPopup', () => ({
  default: () => popup => popup
}));
vi.mock('../common/Markers/Components', () => ({
  EntrancePopup: () => null,
  NetworkPopup: () => null,
  MassifPopup: () => null,
  OrganizationPopup: () => null
}));

const detail = {
  id: 1,
  name: 'Test entity',
  latitude: 45.5,
  longitude: 6.5,
  entrances: [{ latitude: 45.5, longitude: 6.5 }],
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

beforeEach(() => {
  map.openPopup.mockClear();
  queryClient.clear();
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  store.dispatch(logout());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each(['entrance', 'network', 'massif', 'organization'])(
  'uses the current session for a %s popup without remounting',
  async type => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => detail
    });
    vi.stubGlobal('fetch', fetchMock);
    const { rerender } = render(<PopupTargetHandler />);
    for (const [index, token] of [null, 'first', 'second', null].entries()) {
      if (token) store.dispatch(fetchLoginSuccess({ id: 1 }, token));
      else store.dispatch(logout());
      const before = fetchMock.mock.calls.length;
      rerender(<PopupTargetHandler popupTarget={{ type, id: index + 1 }} />);
      // Resolve this popup before changing session on the mounted component.
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() =>
        expect(map.openPopup).toHaveBeenCalledTimes(index + 1)
      );
      expect(fetchMock.mock.calls.length - before).toBe(
        type === 'massif' ? 2 : 1
      );
      fetchMock.mock.calls.slice(before).forEach(([, options]) => {
        expect(new Headers(options.headers).get('Authorization')).toBe(
          token ? `Bearer ${token}` : null
        );
        if (options.signal) expect(options.signal.aborted).toBe(false);
      });
    }
  }
);

it('preserves the non-fatal statistics fallback', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(url =>
      Promise.resolve({
        ok: !url.endsWith('/statistics'),
        status: url.endsWith('/statistics') ? 503 : 200,
        json: async () => detail
      })
    )
  );
  render(<PopupTargetHandler popupTarget={{ type: 'massif', id: 1 }} />);
  await waitFor(() => expect(map.openPopup).toHaveBeenCalledTimes(1));
  expect(
    map.openPopup.mock.calls[0][0].props.massif.entranceCount
  ).toBeUndefined();
  expect(
    map.openPopup.mock.calls[0][0].props.massif.networkCount
  ).toBeUndefined();
});

it.each([
  [{ nb_entrances: 3, nb_caves: 1, nb_networks: 1 }, 3],
  [{ nb_entrances: 0, nb_networks: 0 }, 0],
  [{ nb_entrances: null }, null],
  [{ nb_caves: 99 }, undefined]
])(
  'passes the real entrance count to the massif popup for %j',
  async (statistics, expected) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(url =>
        Promise.resolve({
          ok: true,
          json: async () => (url.endsWith('/statistics') ? statistics : detail)
        })
      )
    );
    render(<PopupTargetHandler popupTarget={{ type: 'massif', id: 1 }} />);
    await waitFor(() => expect(map.openPopup).toHaveBeenCalledTimes(1));
    expect(map.openPopup.mock.calls[0][0].props.massif).toMatchObject({
      entranceCount: expected,
      networkCount: statistics.nb_networks
    });
  }
);

it('does not retry a rejected session or fall back to anonymous access', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Unauthorized' })
  });
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', fetchMock);
  store.dispatch(fetchLoginSuccess({ id: 1 }, 'revoked'));
  render(<PopupTargetHandler popupTarget={{ type: 'entrance', id: 1 }} />);
  await waitFor(() => expect(errorLog).toHaveBeenCalledTimes(1));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(map.openPopup).not.toHaveBeenCalled();
});

it('aborts pending requests when unmounted', async () => {
  const fetchMock = vi.fn(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError'))
        );
      })
  );
  vi.stubGlobal('fetch', fetchMock);
  const { unmount } = render(
    <PopupTargetHandler popupTarget={{ type: 'massif', id: 1 }} />
  );
  unmount();
  await waitFor(() => {
    fetchMock.mock.calls.forEach(([, { signal }]) => {
      expect(signal.aborted).toBe(true);
    });
  });
  expect(map.openPopup).not.toHaveBeenCalled();
});
