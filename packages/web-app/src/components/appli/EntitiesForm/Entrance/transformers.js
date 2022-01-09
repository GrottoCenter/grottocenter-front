export const makeEntranceData = data => ({
  name: {
    language: data.language,
    text: data.name
  },
  cave: data.caveId,
  country: data.country,
  depth: data.depth,
  isDiving: data.isDiving,
  length: data.length,
  longitude: data.longitude,
  latitude: data.latitude,
  temperature: data.temperature
});

export const makeCaveData = data => ({
  name: {
    language: data.language,
    text: data.caveName
  },
  descriptions: data.descriptions.map(desc => ({
    body: desc.body,
    language: data.language,
    title: desc.title
  })),
  massif: data.massif,
  country: data.country,
  depth: data.depth,
  isDiving: data.isDiving,
  length: data.length,
  longitude: data.longitude,
  latitude: data.latitude,
  temperature: data.temperature
});
