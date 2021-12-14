import { isNil, pathOr } from 'ramda';

export const getAuthor = author => ({
  fullName: author?.nickname || author?.name || author?.surname || 'Unknown',
  name: author?.name || 'Unknown',
  nickname: author?.nickname || 'Unknown',
  surname: author?.surname || 'Unknown'
});

// eslint-disable-next-line import/prefer-default-export
export const getComments = (comments = []) =>
  comments.map(comment => ({
    accessRate: pathOr(0, ['approach'], comment) / 2,
    author: getAuthor(comment?.author),
    body: comment?.body,
    date: comment?.dateInscription,
    id: comment?.id,
    interestRate: pathOr(0, ['aestheticism'], comment) / 2,
    language: comment?.language,
    progressionRate: pathOr(0, ['caving'], comment) / 2,
    title: comment?.title
  }));

export const getDetails = data => ({
  id: data.id,
  name: data.name,
  localisation: `${data.city}, ${data.region}, ${data.country}`,
  depth: pathOr(0, ['cave', 'depth'], data),
  development: pathOr(0, ['cave', 'length'], data),
  coordinates:
    !isNil(data.longitude) && !isNil(data.latitude)
      ? [data.latitude, data.longitude]
      : null,
  interestRate: pathOr(0, ['stats', 'aestheticism'], data) / 2,
  progressionRate: pathOr(0, ['stats', 'caving'], data) / 2,
  accessRate: pathOr(0, ['stats', 'approach'], data) / 2,
  author: getAuthor(data?.author),
  creationDate: data?.cave?.dateInscription
    ? new Date(data?.cave?.dateInscription)
    : '',
  isDivingCave: pathOr(null, ['cave', 'is_diving'], data),
  mountain: pathOr(null, ['massif', 'name'], data),
  undergroundType: pathOr(null, ['massif', 'undergroundType'], data),
  altitude: pathOr(null, ['altitude', 'undergroundType'], data),
  discoveryYear: pathOr(null, ['discoveryYear', 'undergroundType'], data)
});

export const getDescriptions = descriptions =>
  descriptions.map(description => ({
    author: getAuthor(description?.author),
    body: description?.body,
    date: description?.dateInscription
      ? new Date(description?.dateInscription)
      : '',
    id: description?.id,
    language: description?.language?.id,
    title: description?.title
  }));

export const getRiggings = riggings =>
  riggings.map(rigging => ({
    obstacles: isNil(rigging?.obstacles) ? [] : rigging.obstacles,
    author: getAuthor(rigging?.author),
    id: rigging.id,
    language: rigging?.language || '',
    title: rigging?.title || '',
    date: rigging?.dateInscription ? new Date(rigging.dateInscription) : ''
  }));

export const getLocations = locations =>
  locations
    .map(location => ({
      author: getAuthor(location?.author),
      body: location?.body,
      creationDate: location?.dateInscription
        ? new Date(location?.dateInscription)
        : '',
      id: location?.id,
      language: location?.langauge?.id,
      title: location?.title,
      relevance: location?.relevance
    }))
    .sort((l1, l2) => l1.relevance > l2.relevance);
