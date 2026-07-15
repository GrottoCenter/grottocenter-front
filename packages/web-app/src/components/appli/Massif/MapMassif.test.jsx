import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import MapMassif from './MapMassif';

// --- Mocks ---

const mockUpdateLayers = vi.fn();
const mockUpdateEntranceMarkers = vi.fn();
let mockZoom = 8;

vi.mock('react-leaflet', () => {
  const React = require('react');
  return {
    useMap: () => ({
      getZoom: () => mockZoom,
      getBounds: () => ({
        _southWest: { wrap: () => ({ lat: -10, lng: -10 }) },
        _northEast: { wrap: () => ({ lat: 10, lng: 10 }) }
      }),
      fitBounds: vi.fn(),
      getContainer: () => ({ offsetWidth: 100, offsetHeight: 100 }),
      on: vi.fn(),
      off: vi.fn()
    }),
    useMapEvent: vi.fn(),
    useMapEvents: vi.fn(),
    GeoJSON: () => React.createElement('div', { 'data-testid': 'geojson' })
  };
});

vi.mock('leaflet', () => {
  const leafletMock = {
    geoJSON: () => ({
      getBounds: () => ({
        isValid: () => true,
        getSouthWest: () => ({ lat: -10, lng: -10 }),
        getNorthEast: () => ({ lat: 10, lng: 10 })
      })
    }),
    svg: () => ({})
  };
  return { __esModule: true, default: leafletMock, ...leafletMock };
});

vi.mock('../../common/Maps/common/MapContainer', () => {
  const React = require('react');
  const MockMapContainer = ({ children }) =>
    React.createElement('div', { 'data-testid': 'map-container' }, children);
  return { __esModule: true, default: MockMapContainer };
});

vi.mock('../../common/Maps/MapClusters/useHeatLayer', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => ({ updateLayers: mockUpdateLayers }),
    HexGlobalCss: React.createElement('div')
  };
});

vi.mock('../../common/Maps/common/Markers/useMarkers', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => mockUpdateEntranceMarkers,
    MarkerGlobalCss: React.createElement('div')
  };
});

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
  coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]]
});

// --- Tests ---

beforeEach(() => {
  vi.restoreAllMocks();
  mockUpdateLayers.mockClear();
  mockUpdateEntranceMarkers.mockClear();
  mockZoom = 8;
});

afterEach(() => {
  delete global.fetch;
});

describe('MapMassif', () => {
  describe('at low zoom (< MARKERS_LIMIT)', () => {
    it('calls updateLayers with coordinates for entrances', async () => {
      const coords = [[5.5, 44.1], [6.2, 43.8], [7.0, 45.0]];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(coords)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(mockUpdateLayers).toHaveBeenCalledWith({ entrances: coords }, ['entrances']);
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

      expect(global.fetch.mock.calls[0][0]).toContain(
        'entrancesCoordinates'
      );
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

      // At high zoom: heat coordinates are fetched first, then after the response
      // fetchMarkers fires and fetches viewport entrance markers.
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
        expect(mockUpdateEntranceMarkers).toHaveBeenCalledWith(
          entrances
        );
      });
    });

    it('clears heat layers when showing markers', async () => {
      const entrances = [
        { id: 1, name: 'Cave A', latitude: 44.1, longitude: 5.5 }
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(entrances)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(mockUpdateLayers).toHaveBeenCalledWith({}, []);
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
