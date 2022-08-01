import { isNil, pathOr } from 'ramda';
import {
  makeDetails,
  makeEntities,
  makeOverview
} from '../DocumentDetails/transformers';
import getAuthor from '../../util/getAuthor';

export const getComments = (comments = []) =>
  comments.map(comment => ({
    accessRate: pathOr(0, ['approach'], comment) / 2,
    author: getAuthor(comment?.author),
    body: comment?.body,
    date: new Date(comment?.dateInscription),
    id: comment?.id,
    interestRate: pathOr(0, ['aestheticism'], comment) / 2,
    language: comment?.language,
    progressionRate: pathOr(0, ['caving'], comment) / 2,
    title: comment?.title
  }));

export const getDetails = data => ({
  accessRate: pathOr(0, ['stats', 'approach'], data) / 2,
  altitude: data.altitude,
  author: getAuthor(data?.author),
  cave: data.cave,
  coordinates:
    !isNil(data.longitude) && !isNil(data.latitude)
      ? [data.latitude, data.longitude]
      : null,
  country: data.country,
  creationDate: data.dateInscription ? new Date(data.dateInscription) : null,
  depth: pathOr(0, ['cave', 'depth'], data),
  development: pathOr(0, ['cave', 'length'], data),
  discoveryYear: data.discoveryYear,
  id: data.id,
  interestRate: pathOr(0, ['stats', 'aestheticism'], data) / 2,
  isDivingCave: pathOr(null, ['cave', 'isDiving'], data),
  isSensitive: data.isSensitive,
  language: pathOr(undefined, ['names', 0, 'language'], data),
  localisation: `${data.city}, ${data.region}, ${data.country}`,
  massif: pathOr(undefined, ['massifs', 0], data),
  massifs: data.massifs,
  mountain: pathOr(null, ['massif', 'name'], data),
  name: data.name,
  precision: data.precision,
  progressionRate: pathOr(0, ['stats', 'caving'], data) / 2,
  temperature: pathOr(null, ['cave', 'temperature'], data),
  undergroundType: pathOr(null, ['massif', 'undergroundType'], data)
});

export const getDescriptions = descriptions =>
  descriptions
    .map(description => ({
      author: getAuthor(description?.author),
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

export const getDocuments = documents =>
  documents.map(document => ({
    details: makeDetails(document),
    entities: makeEntities(document),
    id: document?.id,
    overview: makeOverview(document)
  }));

export const getHistories = histories =>
  histories
    .map(history => ({
      author: getAuthor(history?.author),
      body: history?.body,
      creationDate: history?.dateInscription
        ? new Date(history?.dateInscription)
        : null,
      entrance: history?.entrance,
      id: history?.id,
      language: history?.language,
      relevance: history?.relevance
    }))
    .sort((l1, l2) => l1.relevance < l2.relevance);

export const getRiggings = riggings =>
  riggings.map(rigging => ({
    obstacles: isNil(rigging?.obstacles) ? [] : rigging.obstacles,
    author: getAuthor(rigging?.author),
    id: rigging.id,
    language: rigging?.language || '',
    title: rigging?.title || '',
    date: rigging?.dateInscription ? new Date(rigging.dateInscription) : null
  }));

export const getLocations = locations =>
  locations
    .map(location => ({
      author: getAuthor(location?.author),
      body: location?.body,
      creationDate: location?.dateInscription
        ? new Date(location?.dateInscription)
        : null,
      entrance: location?.entrance,
      id: location?.id,
      language: location?.language,
      title: location?.title,
      relevance: location?.relevance
    }))
    .sort((l1, l2) => l1.relevance < l2.relevance);
