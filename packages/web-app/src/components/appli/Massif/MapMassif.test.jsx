import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

import MapMassif from './MapMassif';

// --- Mocks ---

const mockClusterLayer = vi.fn();
const mockUpdateEntranceMarkers = vi.fn();
let mockZoom = 8;
const mapState = vi.hoisted(() => ({
  isReady: false,
  container: { offsetWidth: 100, offsetHeight: 100 },
  map: null,
  handlers: new Map()
}));

vi.mock('react-leaflet', async () => {
  const React = await import('react');
  const panes = {};
  const emit = event =>
    mapState.handlers.get(event)?.forEach(handler => handler());
  const map = {
    getZoom: () => (mapState.isReady ? mockZoom : undefined),
    getBounds: vi.fn(() => {
      if (!mapState.isReady) throw new Error('Set map center and zoom first.');
      return {
        _southWest: { wrap: () => ({ lat: -10, lng: -10 }) },
        _northEast: { wrap: () => ({ lat: 10, lng: 10 }) }
      };
    }),
    fitBounds: vi.fn(() => {
      const wasReady = mapState.isReady;
      mapState.isReady = true;
      // Leaflet emits moveend before load when creating its first view.
      emit('moveend');
      if (!wasReady) emit('load');
    }),
    invalidateSize: vi.fn(),
    whenReady: vi.fn(callback => {
      if (mapState.isReady) callback();
      else map.on('load', callback);
    }),
    getContainer: () => mapState.container,
    getPane: name => panes[name],
    createPane: name => {
      panes[name] = { style: {} };
      return panes[name];
    },
    on: vi.fn((event, callback) => {
      if (!mapState.handlers.has(event))
        mapState.handlers.set(event, new Set());
      mapState.handlers.get(event).add(callback);
    }),
    off: vi.fn((event, callback) =>
      mapState.handlers.get(event)?.delete(callback)
    )
  };
  mapState.map = map;
  const useMapEvent = (event, callback) => {
    React.useEffect(() => {
      map.on(event, callback);
      return () => map.off(event, callback);
    }, [event, callback]);
  };
  return {
    useMap: () => map,
    useMapEvent,
    useMapEvents: vi.fn(),
    GeoJSON: () => React.createElement('div', { 'data-testid': 'geojson' })
  };
});

vi.mock('leaflet', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, default: { ...actual.default, svg: () => ({}) } };
});

vi.mock('../../common/Maps/common/MapContainer', async () => {
  const React = await import('react');
  const MockMapContainer = ({ children }) =>
    React.createElement('div', { 'data-testid': 'map-container' }, children);
  return { __esModule: true, default: MockMapContainer };
});

vi.mock('../../common/Maps/MapClusters/ClusterLayer', async () => {
  const React = await import('react');
  return {
    __esModule: true,
    default: props => {
      mockClusterLayer(props);
      return null;
    },
    ClusterGlobalCss: React.createElement('div')
  };
});

vi.mock('../../common/Maps/common/Markers/useMarkers', () => ({
  __esModule: true,
  default: () => mockUpdateEntranceMarkers
}));

vi.mock('../../common/Maps/common/Markers/Components', () => ({
  EntranceMarker: 'entrance-marker',
  EntrancePopup: () => null
}));

vi.mock('../../common/Maps/MapClusters/constants', async importOriginal => ({
  ...(await importOriginal()),
  MARKERS_LIMIT: 13
}));

vi.mock('../../../conf/apiRoutes', () => ({
  getMapEntrancesCoordinatesUrl: '/api/v1/geoloc/entrancesCoordinates',
  getMapEntrancesUrl: '/api/v1/geoloc/entrances'
}));

// --- Test data ---

const samplePolygon = JSON.stringify({
  type: 'MultiPolygon',
  coordinates: [
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]
    ]
  ]
});

// --- Tests ---

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  mockZoom = 8;
  mapState.isReady = false;
  mapState.container = { offsetWidth: 100, offsetHeight: 100 };
  mapState.handlers.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const watchHiddenMap = () => {
  const callbacks = [];
  const disconnect = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback) {
        callbacks.push(callback);
        this.observe = vi.fn();
        this.disconnect = disconnect;
      }
    }
  );
  mapState.container = { offsetWidth: 0, offsetHeight: 0 };
  return {
    notifyResize: () => callbacks.forEach(callback => callback()),
    disconnect
  };
};

describe('MapMassif', () => {
  it.each([
    '',
    '{invalid json',
    'null',
    JSON.stringify({ type: 'MultiPolygon', coordinates: [] }),
    JSON.stringify({ type: 'Polygon', coordinates: [] }),
    JSON.stringify({ type: 'Point', coordinates: [0, 0] }),
    JSON.stringify({ type: 'Polygon', coordinates: [[[null, null]]] }),
    '{"type":"Polygon","coordinates":[[[0,0],[1e999,0],[0,1],[0,0]]]}'
  ])(
    'does not mount a map or fetch markers for unusable geometry %s',
    geogPolygon => {
      render(<MapMassif massifId={635} geogPolygon={geogPolygon} />);
      expect(screen.queryByTestId('map-container')).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mapState.map.getBounds).not.toHaveBeenCalled();
    }
  );

  it('can display valid geometry after an empty polygon and hide it again', async () => {
    const empty = JSON.stringify({ type: 'MultiPolygon', coordinates: [] });
    const { rerender } = render(
      <MapMassif massifId={635} geogPolygon={empty} />
    );
    rerender(<MapMassif massifId={635} geogPolygon={samplePolygon} />);
    expect(screen.getByTestId('map-container')).toBeVisible();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    rerender(<MapMassif massifId={635} geogPolygon={empty} />);
    expect(screen.queryByTestId('map-container')).toBeNull();
  });

  it('waits for a visible initial view even when coordinates arrive first', async () => {
    const { notifyResize } = watchHiddenMap();
    mockZoom = 14;
    const coords = [[5.5, 44.1]];
    global.fetch.mockImplementation(url =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(url.includes('entrancesCoordinates') ? coords : [])
      })
    );
    render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);
    await waitFor(() =>
      expect(mockClusterLayer.mock.lastCall[0].data).toEqual(coords)
    );
    expect(mapState.map.getZoom()).toBeUndefined();
    expect(mapState.map.fitBounds).not.toHaveBeenCalled();
    expect(mapState.map.getBounds).not.toHaveBeenCalled();
    expect(
      mockClusterLayer.mock.calls.every(([props]) => props.enabled === false)
    ).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    mapState.container.offsetWidth = 400;
    mapState.container.offsetHeight = 300;
    act(notifyResize);
    await act(async () => {
      vi.runOnlyPendingTimers();
    });
    expect(mapState.map.fitBounds).toHaveBeenCalledTimes(1);
    expect(mapState.map.getBounds).toHaveBeenCalled();
    expect(
      global.fetch.mock.calls.some(([url]) => url.includes('/entrances?'))
    ).toBe(true);
  });

  it('does not read viewport bounds when the zoom is not finite', () => {
    mockZoom = 14;
    render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);
    const initialReads = mapState.map.getBounds.mock.calls.length;
    mockZoom = undefined;
    act(() => mapState.handlers.get('moveend').forEach(callback => callback()));
    expect(mapState.map.getBounds).toHaveBeenCalledTimes(initialReads);
  });

  it('cancels delayed fitting and its load listener when unmounted', () => {
    const { notifyResize, disconnect } = watchHiddenMap();
    vi.useFakeTimers();
    const { unmount } = render(
      <MapMassif massifId={42} geogPolygon={samplePolygon} />
    );
    mapState.container.offsetWidth = 400;
    mapState.container.offsetHeight = 300;
    act(notifyResize);
    unmount();
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(mapState.map.fitBounds).not.toHaveBeenCalled();
    expect(mapState.handlers.get('load').size).toBe(0);
    expect(disconnect).toHaveBeenCalled();
  });

  describe('at low zoom (< MARKERS_LIMIT)', () => {
    it('feeds the cluster layer with fetched coordinates', async () => {
      const coords = [
        [5.5, 44.1],
        [6.2, 43.8],
        [7.0, 45.0]
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(coords)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        const lastCall = mockClusterLayer.mock.calls.at(-1)?.[0];
        expect(lastCall?.data).toEqual(coords);
        expect(lastCall?.enabled).toBe(true);
      });
    });

    it('clears markers when receiving coordinates', async () => {
      const coords = [[5.5, 44.1]];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(coords)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(mockUpdateEntranceMarkers).toHaveBeenCalledWith(null);
      });
    });

    it('fetches from entrancesCoordinates endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(global.fetch.mock.calls[0][0]).toContain('entrancesCoordinates');
    });
  });

  describe('at high zoom (>= MARKERS_LIMIT)', () => {
    beforeEach(() => {
      mockZoom = 14;
    });

    it('fetches from entrances endpoint', async () => {
      const entrances = [
        { id: 1, name: 'Cave A', latitude: 44.1, longitude: 5.5 }
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(entrances)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      // Viewport markers load once fitBounds has initialized the map.
      await waitFor(() => {
        const urls = global.fetch.mock.calls.map(([url]) => url);
        expect(urls.some(url => url.includes('/entrances?'))).toBe(true);
      });
    });

    it('calls updateEntranceMarkers with entrance objects', async () => {
      const entrances = [
        { id: 1, name: 'Cave A', latitude: 44.1, longitude: 5.5 },
        { id: 2, name: 'Cave B', latitude: 45.0, longitude: 6.2 }
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(entrances)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(mockUpdateEntranceMarkers).toHaveBeenCalledWith(entrances);
      });
    });

    it('disables the cluster layer when showing markers', async () => {
      const entrances = [
        { id: 1, name: 'Cave A', latitude: 44.1, longitude: 5.5 }
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(entrances)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        const lastCall = mockClusterLayer.mock.calls.at(-1)?.[0];
        expect(lastCall?.enabled).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('renders polygon when fetch returns empty array', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(screen.getByTestId('geojson')).toBeInTheDocument();
    });

    it('renders polygon when fetch returns 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' })
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(screen.getByTestId('geojson')).toBeInTheDocument();
    });

    it('renders polygon when fetch returns 500', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' })
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(screen.getByTestId('geojson')).toBeInTheDocument();
    });
  });
});
