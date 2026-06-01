/**
 * Client-side polygon validation utilities using Turf.js.
 *
 * All functions are pure — they take latlngs arrays ({lat, lng} objects)
 * and return results without side effects.
 *
 * Coordinates follow Leaflet convention: {lat, lng} objects.
 * Turf.js uses GeoJSON convention: [lng, lat] arrays.
 */

import { kinks } from '@turf/kinks';
import { area } from '@turf/area';
import { rewind } from '@turf/rewind';
import { polygon as turfPolygon, lineString } from '@turf/helpers';
import { lineIntersect } from '@turf/line-intersect';

export const AREA_LIMIT_KM2 = 35000;

/**
 * Convert latlngs array to a closed GeoJSON coordinate ring.
 * @param {Array<{lat: number, lng: number}>} latlngs
 * @returns {Array<[number, number]>} Closed ring in [lng, lat] format
 */
const toGeoJsonRing = latlngs => {
  const coords = latlngs.map(({ lng, lat }) => [lng, lat]);
  // Close the ring if not already closed
  if (
    coords.length >= 2 &&
    (coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1])
  ) {
    coords.push([...coords[0]]);
  }
  return coords;
};

/**
 * Convert a GeoJSON coordinate ring back to latlngs array (open, no closing point).
 * @param {Array<[number, number]>} ring - Closed ring in [lng, lat] format
 * @returns {Array<{lat: number, lng: number}>}
 */
const fromGeoJsonRing = ring => {
  // Remove closing point
  const open = ring.slice(0, -1);
  return open.map(([lng, lat]) => ({ lat, lng }));
};

/**
 * Normalize winding order for a single polygon ring.
 *
 * RFC 7946 requires:
 * - Exterior rings: counter-clockwise (CCW)
 * - Holes: clockwise (CW)
 *
 * @param {Array<{lat: number, lng: number}>} latlngs - Polygon vertices
 * @param {boolean} isHole - Whether this ring is a hole
 * @returns {Array<{lat: number, lng: number}>} Normalized latlngs
 */
export const normalizeWinding = (latlngs, isHole) => {
  if (!latlngs || latlngs.length < 3) return latlngs;

  const ring = toGeoJsonRing(latlngs);

  // Build a GeoJSON polygon to pass to rewind.
  // For a hole, we still wrap it as the exterior ring of a temporary polygon
  // because rewind() normalizes the exterior to CCW (RFC 7946 default).
  // We then reverse the result for holes to get CW winding.
  const geojson = turfPolygon([ring]);
  const rewound = rewind(geojson);
  let normalizedRing = rewound.geometry.coordinates[0];

  // If this is a hole, we need CW winding — reverse the CCW result
  if (isHole) {
    normalizedRing = [...normalizedRing].reverse();
  }

  return fromGeoJsonRing(normalizedRing);
};

/**
 * Check a single polygon for self-intersections.
 *
 * @param {Array<{lat: number, lng: number}>} latlngs - Polygon vertices
 * @returns {{ hasSelfIntersection: boolean, kinkCount: number, kinkPoints: Array<{lat: number, lng: number}> }}
 */
export const checkSelfIntersections = latlngs => {
  if (!latlngs || latlngs.length < 4) {
    return { hasSelfIntersection: false, kinkCount: 0, kinkPoints: [] };
  }

  const ring = toGeoJsonRing(latlngs);
  const geojson = turfPolygon([ring]);
  const result = kinks(geojson);
  const kinkCount = result.features.length;
  const kinkPoints = result.features.map(f => ({
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0]
  }));

  return {
    hasSelfIntersection: kinkCount > 0,
    kinkCount,
    kinkPoints
  };
};

/**
 * Check if a polygon has enough vertices.
 * A valid polygon needs at least 3 points.
 *
 * Note: this does not deduplicate — Leaflet already prevents duplicate
 * consecutive vertices in drawn polygons, and the shapefile import strips
 * the closing vertex before reaching this check.
 *
 * @param {Array<{lat: number, lng: number}>} latlngs - Polygon vertices
 * @returns {boolean} true if valid (>= 3 points)
 */
export const hasMinimumPoints = latlngs => {
  if (!latlngs) return false;
  return latlngs.length >= 3;
};

/**
 * Compute total area of non-hole polygons in km².
 *
 * @param {Array<{latlngs: Array, isHole: boolean}>} layers - Layer objects
 * @returns {number} Total area in km², rounded to nearest integer
 */
export const computeTotalArea = layers => {
  if (!layers || layers.length === 0) return 0;

  const nonHoleLayers = layers.filter(l => !l.isHole);
  if (nonHoleLayers.length === 0) return 0;

  const totalM2 = nonHoleLayers.reduce((sum, layer) => {
    if (!layer.latlngs || layer.latlngs.length < 3) return sum;
    const ring = toGeoJsonRing(layer.latlngs);
    const geojson = turfPolygon([ring]);
    return sum + area(geojson);
  }, 0);

  return Math.round(totalM2 / 1_000_000);
};

/**
 * Run all per-polygon validations and return error flags.
 *
 * @param {Array<{lat: number, lng: number}>} latlngs - Polygon vertices
 * @returns {{ hasSelfIntersection: boolean, tooFewPoints: boolean, kinkPoints: Array<{lat: number, lng: number}> }}
 */
export const validatePolygon = latlngs => {
  const tooFewPoints = !hasMinimumPoints(latlngs);
  const { hasSelfIntersection, kinkPoints } = tooFewPoints
    ? { hasSelfIntersection: false, kinkPoints: [] }
    : checkSelfIntersections(latlngs);

  return { hasSelfIntersection, tooFewPoints, kinkPoints };
};

/**
 * Check for intersections between different polygons (inter-polygon crossings).
 *
 * Compares each pair of polygon boundaries and returns the
 * intersection points where their edges cross.
 *
 * Note: holes are intentionally included in the comparison. A hole that is
 * properly contained inside its outer polygon will not produce false positives
 * because its edges do not cross the outer ring. If a hole's boundary does
 * cross another polygon's boundary, that is a genuine geometric error that
 * should be reported.
 *
 * @param {Array<{latlngs: Array<{lat: number, lng: number}>, isHole: boolean}>} layers
 * @returns {Array<{lat: number, lng: number}>} Intersection points
 */
export const checkInterPolygonIntersections = layers => {
  if (!layers || layers.length < 2) return [];

  const validLayers = layers.filter(l => l.latlngs?.length >= 3);
  if (validLayers.length < 2) return [];

  const intersectionPoints = [];

  for (let i = 0; i < validLayers.length; i++) {
    const ringA = toGeoJsonRing(validLayers[i].latlngs);
    const lineA = lineString(ringA);

    for (let j = i + 1; j < validLayers.length; j++) {
      const ringB = toGeoJsonRing(validLayers[j].latlngs);
      const lineB = lineString(ringB);

      const result = lineIntersect(lineA, lineB);
      result.features.forEach(f => {
        intersectionPoints.push({
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0]
        });
      });
    }
  }

  return intersectionPoints;
};
