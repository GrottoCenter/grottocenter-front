import { ENTRANCE_ONLY } from './caveType';

export const makeEntranceData = (data, entityType) => {
  const entranceData = {
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
    altitude: data.entrance.altitude ? Number(data.entrance.altitude) : null,
    yearDiscovery: data.entrance.yearDiscovery
      ? Number(data.entrance.yearDiscovery)
      : null
  };

  // Only administrators edit the sensitivity lock: leave the key out entirely
  // when the form doesn't hold a value so the API keeps its own default.
  if (data.entrance.isSensitiveLocked != null) {
    entranceData.isSensitiveLocked = Boolean(data.entrance.isSensitiveLocked);
  }

  // Only include coordinates when available — they are hidden from non-admin
  // users on sensitive entrances, so omitting them prevents overwriting the
  // stored values with empty ones.
  if (
    data.entrance.longitude != null &&
    data.entrance.longitude !== '' &&
    data.entrance.latitude != null &&
    data.entrance.latitude !== ''
  ) {
    entranceData.longitude = data.entrance.longitude;
    entranceData.latitude = data.entrance.latitude;
  }

  return entranceData;
};

export const hasCaveChanged = (caveData, originalCaveValues) => {
  if (!originalCaveValues) return true;
  return (
    caveData.name.text !== originalCaveValues.name ||
    caveData.name.language !== originalCaveValues.language ||
    (caveData.depth || 0) !== (Number(originalCaveValues.depth) || 0) ||
    (caveData.length || 0) !== (Number(originalCaveValues.length) || 0) ||
    (caveData.temperature || 0) !==
      (Number(originalCaveValues.temperature) || 0) ||
    Boolean(caveData.isDiving) !== Boolean(originalCaveValues.isDiving)
  );
};

// IMPORTANT: keep in sync with the entranceValues prop shape in EntranceEdit.jsx.
// Adding a field to the form without updating this function causes the optimisation
// to silently skip the PUT for that field.
export const hasEntranceChanged = (entranceDataFmt, originalEntranceValues) => {
  if (!originalEntranceValues) return true;
  return (
    entranceDataFmt.name.text !== originalEntranceValues.name ||
    entranceDataFmt.name.language !== originalEntranceValues.language ||
    Boolean(entranceDataFmt.isSensitive) !==
      Boolean(originalEntranceValues.isSensitive) ||
    Boolean(entranceDataFmt.isSensitiveLocked) !==
      Boolean(originalEntranceValues.isSensitiveLocked) ||
    Boolean(entranceDataFmt.hasBat) !==
      Boolean(originalEntranceValues.hasBat) ||
    Boolean(entranceDataFmt.dangerFlooding) !==
      Boolean(originalEntranceValues.dangerFlooding) ||
    Boolean(entranceDataFmt.dangerCo2) !==
      Boolean(originalEntranceValues.dangerCo2) ||
    Boolean(entranceDataFmt.dangerRockfall) !==
      Boolean(originalEntranceValues.dangerRockfall) ||
    Boolean(entranceDataFmt.dangerPollution) !==
      Boolean(originalEntranceValues.dangerPollution) ||
    Boolean(entranceDataFmt.needCleanGear) !==
      Boolean(originalEntranceValues.needCleanGear) ||
    Boolean(entranceDataFmt.needStayOnTrail) !==
      Boolean(originalEntranceValues.needStayOnTrail) ||
    Boolean(entranceDataFmt.hasRules) !==
      Boolean(originalEntranceValues.hasRules) ||
    Boolean(entranceDataFmt.isTouristic) !==
      Boolean(originalEntranceValues.isTouristic) ||
    (entranceDataFmt.altitude ?? null) !==
      (originalEntranceValues.altitude != null
        ? Number(originalEntranceValues.altitude)
        : null) ||
    (entranceDataFmt.yearDiscovery ?? null) !==
      (originalEntranceValues.yearDiscovery != null
        ? Number(originalEntranceValues.yearDiscovery)
        : null) ||
    // Coordinates are omitted from entranceDataFmt when the entrance is sensitive
    // and the user is non-admin, so treat undefined as "no change intended".
    (entranceDataFmt.longitude !== undefined &&
      String(entranceDataFmt.longitude) !==
        String(originalEntranceValues.longitude ?? '')) ||
    (entranceDataFmt.latitude !== undefined &&
      String(entranceDataFmt.latitude) !==
        String(originalEntranceValues.latitude ?? ''))
  );
};

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
