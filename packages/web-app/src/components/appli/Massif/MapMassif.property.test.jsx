import React from 'react';
import { render, waitFor } from '@testing-library/react';
import fc from 'fast-check';

import MapMassif from './MapMassif';

// --- Mocks (same pattern as MapMassif.test.jsx) ---

const mockClusterLayer = vi.fn();
const mockUpdateEntranceMarkers = vi.fn();

vi.mock('react-leaflet', () => {
  const React = require('react');
  // Panes live on the map instance in real Leaflet, but useMap() below returns a
  // fresh stub on every call — so the registry is kept in the module closure.
  const panes = {};
  return {
    useMap: () => ({
      getZoom: () => 8,
      getBounds: () => ({
        _southWest: { wrap: () => ({ lat: -10, lng: -10 }) },
        _northEast: { wrap: () => ({ lat: 10, lng: 10 }) }
      }),
      fitBounds: vi.fn(),
      getContainer: () => ({ offsetWidth: 100, offsetHeight: 100 }),
      getPane: name => panes[name],
      createPane: name => {
        panes[name] = { style: {} };
        return panes[name];
      },
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

vi.mock('../../common/Maps/MapClusters/ClusterLayer', () => {
  const React = require('react');
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

const samplePolygon = JSON.stringify({
  type: 'MultiPolygon',
  coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]]
});

beforeEach(() => {
  mockClusterLayer.mockClear();
  mockUpdateEntranceMarkers.mockClear();
});

afterEach(() => {
  delete global.fetch;
});

/**
 * Property 1: the cluster layer receives the same data the API returned
 *
 * For any array of entrance coordinates returned by the Geoloc_Endpoint
 * (including the empty array), the MapMassif component SHALL pass exactly
 * that data to the ClusterLayer (at low zoom, coordinates feed the cluster).
 *
 * Validates: Requirements 2.3, 2.4
 */
describe('MapMassif property tests', () => {
  // fast-check runs many render iterations — needs more than Vitest's 5s default.
  vi.setConfig({ testTimeout: 30000 });

  const coordArb = fc.array(
    fc.tuple(
      fc.float({ noNaN: true, noDefaultInfinity: true }),
      fc.float({ noNaN: true, noDefaultInfinity: true })
    )
  );

  it('passes all fetched coordinates to the cluster layer', async () => {
    await fc.assert(
      fc.asyncProperty(coordArb, async coords => {
        mockClusterLayer.mockClear();
        mockUpdateEntranceMarkers.mockClear();

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(coords)
        });

        const { unmount } = render(
          <MapMassif massifId={1} geogPolygon={samplePolygon} />
        );

        await waitFor(() => {
          const lastCall = mockClusterLayer.mock.calls.at(-1)?.[0];
          expect(lastCall?.data).toEqual(coords);
        });

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
