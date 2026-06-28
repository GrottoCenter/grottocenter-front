// Mean length of one degree of latitude, in kilometres. Constant everywhere.
const KM_PER_DEGREE_LAT = 111.32;

const clamp = (min, max, value) => Math.max(min, Math.min(max, value));

/**
 * Compute a geographic bounding box (south-west / north-east corners) around a
 * center point for a given radius in kilometres.
 *
 * Latitude offset is constant; longitude offset grows as latitude approaches
 * the poles (where meridians converge). Near the poles cos(lat) tends to 0, so
 * we fall back to a full-longitude box to avoid dividing by ~0.
 *
 * @param {number} lat - Center latitude in decimal degrees.
 * @param {number} lng - Center longitude in decimal degrees.
 * @param {number} [radiusKm=1] - Search radius in kilometres.
 * @returns {{sw_lat:number, sw_lng:number, ne_lat:number, ne_lng:number}|null}
 *   The bounding box, or null when the inputs are not valid finite numbers.
 */
export const computeBoundingBox = (lat, lng, radiusKm = 1) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return null;

  const latOffset = radiusKm / KM_PER_DEGREE_LAT;
  const cosLat = Math.cos((latNum * Math.PI) / 180);
  const lngOffset =
    Math.abs(cosLat) < 1e-9
      ? 180 // Near the poles: cover the whole longitude range.
      : radiusKm / (KM_PER_DEGREE_LAT * cosLat);

  return {
    sw_lat: clamp(-90, 90, latNum - latOffset),
    sw_lng: clamp(-180, 180, lngNum - lngOffset),
    ne_lat: clamp(-90, 90, latNum + latOffset),
    ne_lng: clamp(-180, 180, lngNum + lngOffset)
  };
};

export default computeBoundingBox;
