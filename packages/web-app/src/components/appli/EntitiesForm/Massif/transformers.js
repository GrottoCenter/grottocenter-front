export const makeMassifPostData = data => ({
  name: data.massif.name,
  description: data.massif.description,
  descriptionTitle: data.massif.descriptionTitle,
  descriptionAndNameLanguage: { id: data.massif.language },
  geogPolygon: data.massif.geoJson
});

export const makeMassifPutData = (data, defautltValue) => {
  const myObj = {};
  myObj.id = defautltValue.massifId;
  if (
    JSON.stringify(data.massif.geoJson) !==
    JSON.stringify(defautltValue.geoJson)
  ) {
    myObj.geogPolygon = data.massif.geoJson;
  }

  return myObj;
};

export const makeMassifValueData = data => {
  const myObj = {};
  if (data) {
    myObj.massifId = data.id;
    myObj.name = data.name || '';

    if (data.names && data.names[0]) {
      myObj.language = data.names[0].language || '';
      myObj.nameId = data.names[0].id;
    } else myObj.language = '';

    if (data.descriptions && data.descriptions[0]) {
      myObj.description = data.descriptions[0].body || '';
      myObj.descriptionTitle = data.descriptions[0].title || '';
      myObj.descriptionId = data.descriptions[0].id;
    } else {
      myObj.description = '';
      myObj.descriptionTitle = '';
    }

    myObj.geoJson = data.geogPolygon ? JSON.parse(data.geogPolygon) : null;

    return myObj;
  }
  return null;
};
