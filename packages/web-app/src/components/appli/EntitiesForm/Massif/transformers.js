import { pathOr, pipe } from 'ramda';

export const makeMassifPostData = data => ({
  name: data.massif.name,
  description: data.massif.description,
  descriptionTitle: data.massif.descriptionTitle,
  descriptionAndNameLanguage: { id: data.massif.language },
  geogPolygon: data.massif.geoJson
});

export const makeMassifPutData = (data, massifValues) => {
  const myObj = {};
  myObj.id = massifValues.massifId;
  if (
    JSON.stringify(data.massif.geoJson) !== JSON.stringify(massifValues.geoJson)
  ) {
    myObj.geogPolygon = data.massif.geoJson;
  }

  return myObj;
};

export const makeMassifValueData = data => {
  if (data) {
    const getGeoJson = pipe(
      d => pathOr('', ['geogPolygon'], d),
      res => {
        if (res) {
          return JSON.parse(res);
        }
        return null;
      }
    );

    const myObj = {
      description: pathOr('', ['descriptions', 0, 'body'], data),
      descriptionTitle: pathOr('', ['descriptions', 0, 'title'], data),
      descriptionId: pathOr(undefined, ['descriptions', 0, 'id'], data),
      language: pathOr('', ['names', 0, 'language'], data),
      nameId: pathOr(undefined, ['names', 0, 'id'], data),
      massifId: pathOr(undefined, ['id'], data),
      name: pathOr('', ['name'], data),
      geoJson: getGeoJson(data)
    };

    return myObj;
  }
  return null;
};
