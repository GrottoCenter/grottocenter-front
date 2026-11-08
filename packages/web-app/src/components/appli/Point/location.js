const hasCoordinates = entrance =>
  Number.isFinite(entrance.latitude) &&
  Math.abs(entrance.latitude) <= 90 &&
  Number.isFinite(entrance.longitude) &&
  Math.abs(entrance.longitude) <= 180;

// A network's provisional position is the centre of its public entrances.
// A wholly protected location follows the entrance page's admin-only visibility.
// Never use stored underground point coordinates: they may be obsolete or reveal
// a protected location. Replace this approximation if the API adds point locations.
export const getUndergroundLocation = (
  sourceEntrances = [],
  isAdmin = false
) => {
  const entrances = sourceEntrances.filter(e => !e.isDeleted);
  const publicEntrances = entrances.filter(e => !e.isSensitive);
  const isSensitive = entrances.length > 0 && publicEntrances.length === 0;
  const candidates = isSensitive && isAdmin ? entrances : publicEntrances;
  const locatedEntrances = candidates.filter(hasCoordinates);
  let coordinates = null;
  if (locatedEntrances.length > 0) {
    const totals = locatedEntrances.reduce(
      (sum, entrance) => ({
        latitude: sum.latitude + entrance.latitude,
        longitude: sum.longitude + entrance.longitude
      }),
      { latitude: 0, longitude: 0 }
    );
    coordinates = {
      latitude: totals.latitude / locatedEntrances.length,
      longitude: totals.longitude / locatedEntrances.length
    };
  }
  return {
    coordinates,
    isSensitive,
    isSensitiveLocked: isSensitive && entrances.some(e => e.isSensitiveLocked)
  };
};
