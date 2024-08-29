// eslint-disable-next-line import/prefer-default-export
export const getSafeData = data => ({
  id: data.id,
  author: data?.author,
  reviewer: data?.reviewer,
  creationDate: data.dateInscription,
  reviewedDate: data.dateReviewed,
  altitude: data.altitude,
  depth: data.depth,
  length: data.length,
  latitude: data.latitude,
  longitude: data.longitude,
  temperature: data.temperature,
  isDivingCave: data.isDiving,
  descriptions: data.descriptions,
  entrances: data.entrances ?? [],
  massif: data?.massifs?.[0] ?? undefined,
  massifs: data.massifs,
  name: data?.names?.[0]?.name ?? data.name,
  names: data.names,
  undergroundType: data?.massif?.undergroundType ?? null,
  redirectTo: data.redirectTo
});
