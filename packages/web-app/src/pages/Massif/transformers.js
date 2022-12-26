import getAuthor from '../../util/getAuthor';

const getDescriptions = descriptions =>
  descriptions
    .map(description => ({
      author: getAuthor(description?.author),
      reviewer: getAuthor(description?.reviewer),
      body: description?.body,
      creationDate: description?.dateInscription
        ? new Date(description?.dateInscription)
        : null,
      id: description?.id,
      language: description?.language,
      title: description?.title,
      relevance: description?.relevance
    }))
    .sort((l1, l2) => l1.relevance < l2.relevance);

const getDetails = massif => {
  if (!massif) {
    return {};
  }
  return {
    id: massif.id,
    author: getAuthor(massif?.author),
    reviewer: massif?.reviewer ? getAuthor(massif?.reviewer) : null,
    dateInscription: massif.dateInscription,
    dateReviewed: massif.dateReviewed,
    geogPolygon: massif.geoJson,
    name: massif.name,
    names: massif.names,
    isDeleted: massif.isDeleted
  };
};

const getDocuments = documents =>
  documents.map(document => ({
    ...document,
    title: document?.titles[0].text
  }));

const getEntrances = entrances => entrances;
const getNetworks = networks => networks;

export { getDescriptions, getDetails, getDocuments, getEntrances, getNetworks };
