import React from 'react';
import { render, waitFor } from '@testing-library/react';
import fc from 'fast-check';

import MapMassif from './MapMassif';

// --- Mocks (same pattern as MapMassif.test.jsx) ---

const mockUpdateHeatData = jest.fn();
const mockUpdateEntranceMarkers = jest.fn();

jest.mock('react-leaflet', () => {
  const React = require('react');
  return {
    useMap: () => ({
      getZoom: () => 8,
      getBounds: () => ({
        _southWest: { wrap: () => ({ lat: -10, lng: -10 }) },
        _northEast: { wrap: () => ({ lat: 10, lng: 10 }) }
      }),
      fitBounds: jest.fn()
    }),
    useMapEvents: () => null,
    GeoJSON: () => React.createElement('div', { 'data-testid': 'geojson' })
  };
});

jest.mock('leaflet', () => ({
  geoJSON: () => ({
    getBounds: () => ({ isValid: () => true })
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

const samplePolygon = JSON.stringify({
  type: 'MultiPolygon',
  coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]]
});

beforeEach(() => {
  mockUpdateHeatData.mockClear();
  mockUpdateEntranceMarkers.mockClear();
});

afterEach(() => {
  delete global.fetch;
});

/**
 * Property 1: updateHeatData receives the same data the API returned
 *
 * For any array of entrance coordinates returned by the
 * Geoloc_Endpoint (including the empty array), the MapMassif
 * component SHALL pass exactly that data to updateHeatData
 * (at low zoom, coordinates go to the heat layer).
 *
 * Validates: Requirements 2.3, 2.4
 */
describe('MapMassif property tests', () => {
  jest.setTimeout(30000);

  const coordArb = fc.array(
    fc.tuple(
      fc.float({ noNaN: true, noDefaultInfinity: true }),
      fc.float({ noNaN: true, noDefaultInfinity: true })
    )
  );

  it('passes all fetched coordinates to updateHeatData', async () => {
    await fc.assert(
      fc.asyncProperty(coordArb, async coords => {
        mockUpdateHeatData.mockClear();
        mockUpdateEntranceMarkers.mockClear();

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(coords)
        });

        const { unmount } = render(
          <MapMassif massifId={1} geogPolygon={samplePolygon} />
        );

        await waitFor(() => {
          expect(mockUpdateHeatData).toHaveBeenCalledWith(coords);
        });

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
