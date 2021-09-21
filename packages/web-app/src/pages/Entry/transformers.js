import { isNil, pathOr } from 'ramda';

const getAuthor = author => ({
  name: author?.name || ''
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
  author: pathOr('Author', ['cave', 'author'], data),
  creationDate: pathOr(null, ['cave', 'dateInscription'], data),
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
    date: description?.date,
    id: description?.id,
    language: description?.id,
    title: description?.title
  }));

export const getRiggings = riggings =>
  riggings.map(rigging => ({
    anchors: rigging?.anchors,
    author: getAuthor(rigging?.author),
    id: rigging.id,
    language: rigging?.language || '',
    observations: rigging?.observations,
    obstacles: rigging?.obstacles,
    ropes: rigging?.ropes,
    title: rigging?.title || ''
  }));
