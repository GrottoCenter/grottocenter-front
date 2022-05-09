const makeMassifData = data => ({
  name: data.massif.name,
  description: data.massif.description,
  descriptionTitle: data.massif.descriptionTitle,
  descriptionAndNameLanguage: { id: data.massif.language },
  geogPolygon: data.massif.geoJson
});
export default makeMassifData;
