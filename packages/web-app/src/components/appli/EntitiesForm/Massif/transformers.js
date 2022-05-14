export const makeMassifPostData = data => ({
  name: data.massif.name,
  description: data.massif.description,
  descriptionTitle: data.massif.descriptionTitle,
  descriptionAndNameLanguage: { id: data.massif.language },
  geogPolygon: data.massif.geoJson
});

export const makeMassifPutData = data => ({
  name: data.massif.name,
  description: data.massif.description,
  descriptionTitle: data.massif.descriptionTitle,
  descriptionAndNameLanguage: { id: data.massif.language },
  geogPolygon: data.massif.geoJson
});

export const makeMassifValueData = data => {
  const myObj = {};
  if (data) {
    myObj.name = data.name || '';

    if (data.names && data.names[0]) {
      myObj.language = data.names[0].language || '';
    } else myObj.language = '';

    if (data.descriptions && data.descriptions[0]) {
      myObj.description = data.descriptions[0].body || '';
      myObj.descriptionTitle = data.descriptions[0].title || '';
    } else {
      myObj.description = '';
      myObj.descriptionTitle = '';
    }

    myObj.geoJson = data.geogPolygon || null;
    return myObj;
  }
  return null;
};
