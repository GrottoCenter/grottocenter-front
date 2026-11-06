export const getPointLocationMessageId = underground => {
  if (underground === true) return 'points.underground';
  if (underground === false) return 'points.surface';
  return 'Unknown';
};

const hasGeographicCoordinates = (longitude, latitude) =>
  Number.isFinite(longitude) &&
  Math.abs(longitude) <= 180 &&
  Number.isFinite(latitude) &&
  Math.abs(latitude) <= 90;

export const isSurfaceMapPoint = point =>
  point.underground === false &&
  !point.isDeleted &&
  hasGeographicCoordinates(point.longitude, point.latitude);

// Compact map records are [longitude, latitude, underground]. Legacy records
// without explicit classification must not become surface points implicitly.
export const selectSurfacePointCoordinates = coordinates =>
  coordinates
    .filter(
      ([longitude, latitude, underground]) =>
        underground === false && hasGeographicCoordinates(longitude, latitude)
    )
    .map(([longitude, latitude]) => [longitude, latitude]);
