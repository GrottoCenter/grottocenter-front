import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import MapMassif from './MapMassif';

// --- Mocks ---

const mockUpdateHeatData = jest.fn();
const mockUpdateEntranceMarkers = jest.fn();
let mockZoom = 8;

jest.mock('react-leaflet', () => {
  const React = require('react');
  return {
    useMap: () => ({
      getZoom: () => mockZoom,
      getBounds: () => ({
        _southWest: { wrap: () => ({ lat: -10, lng: -10 }) },
        _northEast: { wrap: () => ({ lat: 10, lng: 10 }) }
      }),
      fitBounds: jest.fn()
    }),
    useMapEvent: jest.fn(),
    useMapEvents: jest.fn(),
    GeoJSON: () => React.createElement('div', { 'data-testid': 'geojson' })
  };
});

jest.mock('leaflet', () => ({
  geoJSON: () => ({
    getBounds: () => ({
      isValid: () => true,
      getSouthWest: () => ({ lat: -10, lng: -10 }),
      getNorthEast: () => ({ lat: 10, lng: 10 })
    })
  })
}));

jest.mock('../../common/Maps/common/MapContainer', () => {
  const React = require('react');
  return ({ children }) =>
    React.createElement('div', { 'data-testid': 'map-container' }, children);
});

jest.mock('../../common/Maps/MapClusters/useHeatLayer', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => ({ updateHeatData: mockUpdateHeatData }),
    HexGlobalCss: React.createElement('div')
  };
});

jest.mock('../../common/Maps/common/Markers/useMarkers', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => mockUpdateEntranceMarkers,
    MarkerGlobalCss: React.createElement('div')
  };
});

jest.mock('../../common/Maps/common/Markers/Components', () => ({
  EntranceMarker: 'entrance-marker',
  EntrancePopup: () => null
}));

jest.mock('../../common/Maps/MapClusters/constants', () => ({
  MARKERS_LIMIT: 13
}));

jest.mock('../../../conf/apiRoutes', () => ({
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
  jest.restoreAllMocks();
  mockUpdateHeatData.mockClear();
  mockUpdateEntranceMarkers.mockClear();
  mockZoom = 8;
});

afterEach(() => {
  delete global.fetch;
});

describe('MapMassif', () => {
  describe('at low zoom (< MARKERS_LIMIT)', () => {
    it('calls updateHeatData with coordinates', async () => {
      const coords = [[5.5, 44.1], [6.2, 43.8], [7.0, 45.0]];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(coords)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(mockUpdateHeatData).toHaveBeenCalledWith(coords);
      });
    });

    it('clears markers when receiving coordinates', async () => {
      const coords = [[5.5, 44.1]];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(coords)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(mockUpdateEntranceMarkers).toHaveBeenCalledWith(null);
      });
    });

    it('fetches from entrancesCoordinates endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
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
      global.fetch = jest.fn().mockResolvedValue({
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
      global.fetch = jest.fn().mockResolvedValue({
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

    it('clears heat data when showing markers', async () => {
      const entrances = [
        { id: 1, name: 'Cave A', latitude: 44.1, longitude: 5.5 }
      ];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(entrances)
      });

      render(<MapMassif massifId={42} geogPolygon={samplePolygon} />);

      await waitFor(() => {
        expect(mockUpdateHeatData).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('error handling', () => {
    it('renders polygon when fetch returns empty array', async () => {
      global.fetch = jest.fn().mockResolvedValue({
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
      global.fetch = jest.fn().mockResolvedValue({
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
      global.fetch = jest.fn().mockResolvedValue({
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
