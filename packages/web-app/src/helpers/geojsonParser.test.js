import * as fc from 'fast-check';
import { parseGeoJsonToMultiPolygon } from './geojsonParser';
import { transformToWGS84 } from './coordinateTransform';

// Mock coordinateTransform — identity transform so we can test parsing
// logic in isolation (reprojection has its own tests).
jest.mock('./coordinateTransform', () => ({
  transformToWGS84: jest.fn()
}));

beforeEach(() => {
  transformToWGS84.mockImplementation((coords, _crs, _depth) => coords);
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A single [lng, lat] coordinate pair with realistic ranges. */
const coordArb = fc.tuple(
  fc.double({ min: -180, max: 180, noNaN: true }),
  fc.double({ min: -90, max: 90, noNaN: true })
);

/**
 * A closed linear ring (>= 4 points, first === last).
 * GeoJSON requires rings to have at least 4 positions.
 */
const ringArb = fc
  .array(coordArb, { minLength: 3, maxLength: 20 })
  .map(coords => [...coords, coords[0]]);

/** A valid Polygon coordinate array (outer ring, optional holes). */
const polygonCoordsArb = fc
  .tuple(ringArb, fc.array(ringArb, { minLength: 0, maxLength: 2 }))
  .map(([outer, holes]) => [outer, ...holes]);

/** An empty polygon coordinate array — the case that caused the original bug. */
const emptyPolygonCoordsArb = fc.constantFrom([], [[]], [[]]);

/**
 * A polygon geometry that is either valid or empty. oneof gives roughly
 * equal weight; we list valid twice to bias toward it.
 */
const polygonGeometryArb = fc.oneof(
  polygonCoordsArb.map(coords => ({
    type: 'Polygon',
    coordinates: coords
  })),
  polygonCoordsArb.map(coords => ({
    type: 'Polygon',
    coordinates: coords
  })),
  emptyPolygonCoordsArb.map(coords => ({
    type: 'Polygon',
    coordinates: coords
  }))
);

/** A valid-only polygon geometry (guaranteed non-empty). */
const validPolygonGeometryArb = polygonCoordsArb.map(coords => ({
  type: 'Polygon',
  coordinates: coords
}));

/** A MultiPolygon geometry mixing valid and empty polygons. */
const multiPolygonGeometryArb = fc
  .array(
    fc.oneof(polygonCoordsArb, polygonCoordsArb, emptyPolygonCoordsArb),
    { minLength: 1, maxLength: 6 }
  )
  .map(polys => ({ type: 'MultiPolygon', coordinates: polys }));

/** Unsupported geometry types that the parser should ignore. */
const unsupportedGeometryArb = fc.constantFrom(
  { type: 'Point', coordinates: [0, 0] },
  { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
  { type: 'GeometryCollection', geometries: [] }
);

/**
 * Degenerate / adversarial geometry values: null, undefined, missing
 * coordinates, or wrong types entirely.
 */
const degenerateGeometryArb = fc.constantFrom(
  null,
  undefined,
  { type: 'Polygon' },
  { type: 'Polygon', coordinates: null },
  { type: 'MultiPolygon', coordinates: [] },
  { type: 'MultiPolygon', coordinates: [[], [[]]] }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count how many polygons in a geometry have a non-empty first ring. */
function countValidPolygons(geometry) {
  if (
    !geometry ||
    !geometry.coordinates ||
    geometry.coordinates.length === 0
  ) {
    return 0;
  }
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0] && geometry.coordinates[0].length > 0
      ? 1
      : 0;
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.filter(
      p => p[0] && p[0].length > 0
    ).length;
  }
  return 0;
}

function countValidPolygonsInGeojson(geojson) {
  if (geojson.type === 'FeatureCollection' && geojson.features) {
    return geojson.features.reduce(
      (sum, f) => sum + countValidPolygons(f.geometry),
      0
    );
  }
  if (geojson.type === 'Feature' && geojson.geometry) {
    return countValidPolygons(geojson.geometry);
  }
  if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
    return countValidPolygons(geojson);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe('parseGeoJsonToMultiPolygon', () => {
  /**
   * Output coordinate count equals valid input polygon count.
   * Encodes: every non-empty polygon is preserved, every empty one is dropped.
   * Covers: FeatureCollections with arbitrary mixes of valid and empty polygons.
   */
  it('should produce exactly as many polygons as there are non-empty geometries', () => {
    fc.assert(
      fc.property(
        fc.array(polygonGeometryArb, { minLength: 0, maxLength: 8 }),
        geometries => {
          const geojson = {
            type: 'FeatureCollection',
            features: geometries.map(g => ({
              type: 'Feature',
              properties: {},
              geometry: g
            }))
          };
          const expectedCount = geometries.reduce(
            (sum, g) => sum + countValidPolygons(g),
            0
          );
          const result = parseGeoJsonToMultiPolygon(geojson);

          if (expectedCount === 0) {
            expect(result).toBeNull();
          } else {
            expect(result.coordinates).toHaveLength(expectedCount);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * Coordinate data is preserved: no data loss during parsing.
   * Encodes: parsing is lossless for valid polygons (without CRS transform).
   * Covers: single valid Polygon geometries.
   */
  it('should preserve coordinate data for valid polygons', () => {
    fc.assert(
      fc.property(validPolygonGeometryArb, geometry => {
        const geojson = {
          type: 'Feature',
          geometry,
          properties: {}
        };
        const result = parseGeoJsonToMultiPolygon(geojson);

        expect(result).not.toBeNull();
        expect(result.coordinates).toHaveLength(1);
        expect(result.coordinates[0]).toEqual(geometry.coordinates);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Output is always null or a well-formed MultiPolygon.
   * Encodes: the function's return type contract.
   * Covers: all GeoJSON wrapper types with mixed geometries.
   */
  it('should always return null or a MultiPolygon with type and coordinates', () => {
    const geojsonArb = fc.oneof(
      // FeatureCollection
      fc
        .array(polygonGeometryArb, { minLength: 0, maxLength: 6 })
        .map(geoms => ({
          type: 'FeatureCollection',
          features: geoms.map(g => ({
            type: 'Feature',
            properties: {},
            geometry: g
          }))
        })),
      // Single Feature
      polygonGeometryArb.map(g => ({
        type: 'Feature',
        properties: {},
        geometry: g
      })),
      // Bare geometry
      polygonGeometryArb
    );

    fc.assert(
      fc.property(geojsonArb, geojson => {
        const result = parseGeoJsonToMultiPolygon(geojson);

        if (result !== null) {
          expect(result.type).toBe('MultiPolygon');
          expect(Array.isArray(result.coordinates)).toBe(true);
          expect(result.coordinates.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Empty and degenerate geometries never produce output polygons.
   * Encodes: the guard against the original crash (empty coordinates).
   * Covers: null geometry, missing coordinates, empty arrays, empty rings.
   */
  it('should never crash or produce polygons from degenerate geometries', () => {
    fc.assert(
      fc.property(degenerateGeometryArb, geometry => {
        const geojson = {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry }]
        };
        const result = parseGeoJsonToMultiPolygon(geojson);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Unsupported geometry types are silently ignored.
   * Encodes: only Polygon and MultiPolygon are extracted.
   * Covers: Point, LineString, GeometryCollection.
   */
  it('should ignore unsupported geometry types', () => {
    fc.assert(
      fc.property(unsupportedGeometryArb, geometry => {
        const geojson = {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry }]
        };
        expect(parseGeoJsonToMultiPolygon(geojson)).toBeNull();
      }),
      { numRuns: 50 }
    );
  });

  /**
   * MultiPolygon geometries: valid sub-polygons are kept, empty ones dropped.
   * Encodes: per-polygon filtering within a MultiPolygon geometry.
   * Covers: MultiPolygon with mixed valid and empty polygon arrays.
   */
  it('should filter empty polygons within a MultiPolygon geometry', () => {
    fc.assert(
      fc.property(multiPolygonGeometryArb, geometry => {
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry
        };
        const expectedCount = countValidPolygons(geometry);
        const result = parseGeoJsonToMultiPolygon(geojson);

        if (expectedCount === 0) {
          expect(result).toBeNull();
        } else {
          expect(result.coordinates).toHaveLength(expectedCount);
          // Every output polygon must have a non-empty first ring
          result.coordinates.forEach(poly => {
            expect(poly[0].length).toBeGreaterThan(0);
          });
        }
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Bare Polygon and bare MultiPolygon at the top level are handled
   * identically to when wrapped in a Feature.
   * Encodes: all three GeoJSON entry points produce the same result.
   * Covers: bare geometry objects (no Feature wrapper).
   */
  it('should produce the same result for bare geometry as for Feature-wrapped', () => {
    fc.assert(
      fc.property(
        fc.oneof(validPolygonGeometryArb, multiPolygonGeometryArb),
        geometry => {
          const bareResult = parseGeoJsonToMultiPolygon(geometry);
          const wrappedResult = parseGeoJsonToMultiPolygon({
            type: 'Feature',
            properties: {},
            geometry
          });

          expect(bareResult).toEqual(wrappedResult);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * A FeatureCollection mixing valid polygons, empty polygons, null
   * geometries, and unsupported types only keeps the valid polygons.
   * Encodes: robustness against real-world messy GeoJSON files.
   * Covers: the exact scenario from the original bug report.
   */
  it('should handle mixed valid, empty, null, and unsupported features', () => {
    const mixedFeatureArb = fc.oneof(
      validPolygonGeometryArb,
      validPolygonGeometryArb,
      validPolygonGeometryArb,
      validPolygonGeometryArb,
      emptyPolygonCoordsArb.map(c => ({ type: 'Polygon', coordinates: c })),
      emptyPolygonCoordsArb.map(c => ({ type: 'Polygon', coordinates: c })),
      degenerateGeometryArb,
      unsupportedGeometryArb
    );

    fc.assert(
      fc.property(
        fc.array(mixedFeatureArb, { minLength: 1, maxLength: 10 }),
        geometries => {
          const geojson = {
            type: 'FeatureCollection',
            features: geometries.map(g => ({
              type: 'Feature',
              properties: {},
              geometry: g
            }))
          };
          const expectedCount = countValidPolygonsInGeojson(geojson);
          const result = parseGeoJsonToMultiPolygon(geojson);

          if (expectedCount === 0) {
            expect(result).toBeNull();
          } else {
            expect(result.coordinates).toHaveLength(expectedCount);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Review-driven properties (PR #1203 review by Paul-AUB)
// ---------------------------------------------------------------------------

describe('parseGeoJsonToMultiPolygon — review scenarios', () => {
  /**
   * Default export is parseGeoJsonToMultiPolygon, not extractPolygons.
   * Encodes: review issue #1 — the default export should be the public API.
   * Covers: import ergonomics for consumers using default import.
   */
  it('should export parseGeoJsonToMultiPolygon as the default export', () => {
    // eslint-disable-next-line global-require
    const defaultExport = require('./geojsonParser').default;
    expect(defaultExport).toBe(parseGeoJsonToMultiPolygon);
  });

  /**
   * Null-geometry features mixed with valid features in a FeatureCollection.
   * Encodes: review issue #2 — feature.geometry can legally be null in
   * GeoJSON. The parser must not crash and must still extract valid polygons
   * from sibling features.
   * Covers: FeatureCollections where some features have null geometry and
   * others have valid polygons.
   */
  it('should extract valid polygons when null-geometry features are interspersed', () => {
    fc.assert(
      fc.property(
        fc.array(validPolygonGeometryArb, { minLength: 1, maxLength: 5 }),
        fc.array(fc.constant(null), { minLength: 1, maxLength: 5 }),
        (validGeometries, nullGeometries) => {
          // Interleave valid and null geometries
          const features = [];
          const maxLen = Math.max(
            validGeometries.length,
            nullGeometries.length
          );
          for (let i = 0; i < maxLen; i++) {
            if (i < nullGeometries.length) {
              features.push({
                type: 'Feature',
                properties: {},
                geometry: nullGeometries[i]
              });
            }
            if (i < validGeometries.length) {
              features.push({
                type: 'Feature',
                properties: {},
                geometry: validGeometries[i]
              });
            }
          }

          const geojson = { type: 'FeatureCollection', features };
          const result = parseGeoJsonToMultiPolygon(geojson);

          // All valid polygons must survive; null ones must be dropped
          expect(result).not.toBeNull();
          expect(result.coordinates).toHaveLength(validGeometries.length);

          // Verify the actual coordinate data matches the valid inputs
          validGeometries.forEach((geom, i) => {
            expect(result.coordinates[i]).toEqual(geom.coordinates);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * transformToWGS84 receives only the filtered (valid) polygons, not the
   * original array including empty ones.
   * Encodes: review issue #3 — filtering before transforming must pass the
   * correct (filtered) array to transformToWGS84, not the original with
   * empty entries that could break index-dependent logic.
   * Covers: MultiPolygon with CRS set, mixing valid and empty sub-polygons.
   */
  it('should pass only valid polygons to transformToWGS84 for MultiPolygon with CRS', () => {
    fc.assert(
      fc.property(
        fc.array(polygonCoordsArb, { minLength: 1, maxLength: 4 }),
        fc.array(emptyPolygonCoordsArb, { minLength: 1, maxLength: 3 }),
        (validPolys, emptyPolys) => {
          transformToWGS84.mockClear();

          // Build a MultiPolygon with empties first, then valids
          const allCoords = [...emptyPolys, ...validPolys];
          const geojson = {
            type: 'FeatureCollection',
            crs: {
              type: 'name',
              properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
            },
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'MultiPolygon',
                  coordinates: allCoords
                }
              }
            ]
          };

          const result = parseGeoJsonToMultiPolygon(geojson);

          expect(result).not.toBeNull();
          expect(result.coordinates).toHaveLength(validPolys.length);

          // Every output polygon must have a non-empty first ring —
          // no empty polygon should have leaked through.
          result.coordinates.forEach(poly => {
            expect(Array.isArray(poly[0])).toBe(true);
            expect(poly[0].length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * transformToWGS84 is called with the filtered array when a non-passthrough
   * CRS is present.
   * Encodes: review issue #3 — the transform function must receive exactly
   * the valid polygons, preserving count and order.
   * Covers: MultiPolygon with a non-identity CRS requiring actual transform.
   */
  it('should call transformToWGS84 with only valid polygons for non-passthrough CRS', () => {
    fc.assert(
      fc.property(
        fc.array(polygonCoordsArb, { minLength: 1, maxLength: 4 }),
        fc.array(emptyPolygonCoordsArb, { minLength: 1, maxLength: 3 }),
        (validPolys, emptyPolys) => {
          transformToWGS84.mockClear();

          const allCoords = [...emptyPolys, ...validPolys];
          const geojson = {
            type: 'FeatureCollection',
            crs: {
              type: 'name',
              properties: { name: 'urn:ogc:def:crs:EPSG::2154' }
            },
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'MultiPolygon',
                  coordinates: allCoords
                }
              }
            ]
          };

          parseGeoJsonToMultiPolygon(geojson);

          // transformToWGS84 must have been called with the filtered array
          expect(transformToWGS84).toHaveBeenCalledTimes(1);
          const [receivedCoords, , depth] = transformToWGS84.mock.calls[0];
          expect(depth).toBe(3);
          // Must receive exactly the valid polygons, not the full array
          expect(receivedCoords).toHaveLength(validPolys.length);
          receivedCoords.forEach(poly => {
            expect(poly[0].length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
