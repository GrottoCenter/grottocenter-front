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
  longitude: data.entrance.longitude,
  latitude: data.entrance.latitude,
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
