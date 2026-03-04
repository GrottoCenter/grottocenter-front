import { transformToWGS84 } from './coordinateTransform';

/**
 * Extract polygon coordinates from a GeoJSON geometry object,
 * skipping features with empty or missing coordinates.
 *
 * Safely handles null/undefined geometry (valid in GeoJSON for features
 * with no spatial representation) by returning an empty array.
 *
 * @param {object|null|undefined} geometry - A GeoJSON geometry object
 * @param {string|null} sourceCRS - Optional source CRS for reprojection
 * @returns {Array} Array of polygon coordinate arrays to push into a MultiPolygon
 */
const extractPolygons = (geometry, sourceCRS) => {
  if (
    !geometry ||
    !geometry.coordinates ||
    geometry.coordinates.length === 0
  ) {
    return [];
  }

  if (geometry.type === 'Polygon') {
    if (geometry.coordinates[0] && geometry.coordinates[0].length > 0) {
      const transformed = sourceCRS
        ? transformToWGS84([geometry.coordinates], sourceCRS, 2)[0]
        : geometry.coordinates;
      return [transformed];
    }
    return [];
  }

  if (geometry.type === 'MultiPolygon') {
    // Filter out empty polygons before transforming. This is safe because
    // transformToWGS84 operates element-wise at depth 3 (per-polygon) and
    // does not rely on original array indices or sibling polygons.
    const validPolygons = geometry.coordinates.filter(
      poly => poly[0] && poly[0].length > 0
    );
    if (validPolygons.length > 0) {
      const transformed = sourceCRS
        ? transformToWGS84(validPolygons, sourceCRS, 3)
        : validPolygons;
      return transformed;
    }
    return [];
  }

  return [];
};

/**
 * Parse a GeoJSON object into a MultiPolygon, skipping empty geometries.
 *
 * @param {object} geojson - A parsed GeoJSON object
 * @returns {{ type: string, coordinates: Array } | null}
 *   A MultiPolygon geometry, or null if no valid polygons were found.
 */
export const parseGeoJsonToMultiPolygon = geojson => {
  const sourceCRS = geojson.crs?.properties?.name;

  const multiPolygon = {
    type: 'MultiPolygon',
    coordinates: []
  };

  if (geojson.type === 'FeatureCollection' && geojson.features) {
    // feature.geometry may be null (valid GeoJSON for features with no
    // spatial representation). extractPolygons handles this gracefully,
    // returning [] for null/undefined geometry.
    geojson.features.forEach(feature => {
      multiPolygon.coordinates.push(
        ...extractPolygons(feature.geometry, sourceCRS)
      );
    });
  } else if (geojson.type === 'Feature' && geojson.geometry) {
    multiPolygon.coordinates.push(
      ...extractPolygons(geojson.geometry, sourceCRS)
    );
  } else if (
    geojson.type === 'Polygon' ||
    geojson.type === 'MultiPolygon'
  ) {
    multiPolygon.coordinates.push(
      ...extractPolygons(geojson, sourceCRS)
    );
  }

  return multiPolygon.coordinates.length > 0 ? multiPolygon : null;
};

export default parseGeoJsonToMultiPolygon;
