/**
 * Count unique vertices in a ring, excluding the closing point
 * if the ring is closed (first === last, as per GeoJSON spec).
 *
 * Accepts both [lng, lat] arrays and { lat, lng } objects.
 */
const isClosedRing = ring => {
  const len = ring.length;
  if (len < 2) return false;
  const first = ring[0];
  const last = ring[len - 1];
  if (Array.isArray(first)) {
    return first[0] === last[0] && first[1] === last[1];
  }
  return first.lat === last.lat && first.lng === last.lng;
};

const countRingVertices = ring => {
  const len = ring.length;
  return isClosedRing(ring) ? len - 1 : len;
};

/**
 * Count total unique vertices across a MultiPolygon's coordinates.
 * coordinates shape: [polygon][ring][point]
 */
export const countMultiPolygonVertices = coordinates =>
  coordinates.reduce(
    (total, polygon) =>
      total + polygon.reduce((sum, ring) => sum + countRingVertices(ring), 0),
    0
  );
