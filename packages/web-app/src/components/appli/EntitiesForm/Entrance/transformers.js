import { ENTRANCE_ONLY } from './caveType';

export const makeEntranceData = (data, entityType) => ({
  // When creating a cave with a single entrance, the name of the entrance is the same as the cave one, in data.cave
  name: {
    language:
      entityType === ENTRANCE_ONLY
        ? data.entrance.language
        : data.cave.language,
    text: entityType === ENTRANCE_ONLY ? data.entrance.name : data.cave.name
  },
  cave: data.cave.id,
  isSensitive: data.entrance.isSensitive,
  hasBat: data.entrance.hasBat,
  dangerFlooding: data.entrance.dangerFlooding,
  dangerCo2: data.entrance.dangerCo2,
  dangerRockfall: data.entrance.dangerRockfall,
  dangerPollution: data.entrance.dangerPollution,
  needCleanGear: data.entrance.needCleanGear,
  needStayOnTrail: data.entrance.needStayOnTrail,
  hasRules: data.entrance.hasRules,
  isTouristic: data.entrance.isTouristic,
  longitude: data.entrance.longitude,
  latitude: data.entrance.latitude,
  altitude: data.entrance.altitude ? Number(data.entrance.altitude) : null,
  yearDiscovery: data.entrance.yearDiscovery
    ? Number(data.entrance.yearDiscovery)
    : null
});

export const makeCaveData = data => ({
  name: {
    language: data.cave.language,
    text: data.cave.name
  },
  descriptions: data.cave.descriptions?.map(desc => ({
    body: desc.body,
    language: data.language,
    title: desc.title
  })),
  depth: Number(data.cave.depth),
  isDiving: data.cave.isDiving,
  length: Number(data.cave.length),
  temperature: Number(data.cave.temperature)
});
