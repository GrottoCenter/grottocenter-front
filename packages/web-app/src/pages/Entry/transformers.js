import { isNil, pathOr } from 'ramda';
import {
  makeDetails,
  makeEntities,
  makeOverview
} from '../DocumentDetails/transformers';
import getAuthor from '../../util/getAuthor';

export const getComments = comments =>
  comments
    .map(comment => ({
      author: getAuthor(comment?.author),
      reviewer: comment?.reviewer ? getAuthor(comment?.reviewer) : null,
      body: comment?.body,
      creationDate: comment?.dateInscription
        ? new Date(comment?.dateInscription)
        : null,
      dateReviewed: comment?.dateReviewed
        ? new Date(comment?.dateReviewed)
        : null,
      id: comment?.id,
      access: comment?.approach,
      interest: comment?.aestheticism,
      progression: comment?.caving,
      language: comment?.language,
      title: comment?.title,
      eTTrail: comment?.eTTrail,
      eTUnderground: comment?.eTUnderground
    }))
    .sort((l1, l2) => l1.date < l2.date);

export const getDetails = data => ({
  altitude: data.altitude,
  author: getAuthor(data?.author),
  reviewer: data?.reviewer ? getAuthor(data?.reviewer) : null,
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
  access: pathOr(0, ['stats', 'approach'], data),
  interest: pathOr(0, ['stats', 'aestheticism'], data),
  progression: pathOr(0, ['stats', 'caving'], data),
  isDivingCave: pathOr(null, ['cave', 'isDiving'], data),
  isSensitive: data.isSensitive,
  language: pathOr(undefined, ['names', 0, 'language'], data),
  localisation: `${data.city}, ${data.region}, ${data.country}`, // TODO rename to location
  massif: pathOr(undefined, ['massifs', 0], data),
  massifs: data.massifs,
  mountain: pathOr(null, ['massif', 'name'], data),
  name: data.name,
  precision: data.precision,
  temperature: pathOr(null, ['cave', 'temperature'], data),
  undergroundType: pathOr(null, ['massif', 'undergroundType'], data)
});

export const getDescriptions = descriptions =>
  descriptions
    .map(description => ({
      author: getAuthor(description?.author),
      reviewer: getAuthor(description?.reviewer),
      body: description?.body,
      creationDate: description?.dateInscription
        ? new Date(description?.dateInscription)
        : null,
      reviewedDate: description?.dateReviewed
        ? new Date(description?.dateReviewed)
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
      id: history?.id,
      creationDate: history?.dateInscription
        ? new Date(history?.dateInscription)
        : null,
      reviewedDate: history?.dateReviewed
        ? new Date(history?.dateReviewed)
        : null,
      author: getAuthor(history?.author),
      reviewer: getAuthor(history?.reviewer),
      body: history?.body,
      relevance: history?.relevance,
      language: history?.language
    }))
    .sort((l1, l2) => l1.relevance < l2.relevance);

export const getRiggings = riggings =>
  riggings.map(rigging => ({
    obstacles: isNil(rigging?.obstacles) ? [] : rigging.obstacles,
    author: getAuthor(rigging?.author),
    reviewer: rigging?.reviewer ? getAuthor(rigging?.reviewer) : null,
    id: rigging.id,
    language: rigging?.language || '',
    title: rigging?.title || '',
    date: rigging?.dateInscription ? new Date(rigging.dateInscription) : null,
    dateReviewed: rigging?.dateReviewed ? new Date(rigging?.dateReviewed) : null
  }));

export const getLocations = locations =>
  locations
    .map(location => ({
      id: location?.id,
      title: location?.title,
      author: getAuthor(location?.author),
      reviewer: getAuthor(location?.reviewer),
      body: location?.body,
      creationDate: location?.dateInscription
        ? new Date(location?.dateInscription)
        : null,
      reviewedDate: location?.dateReviewed
        ? new Date(location?.dateReviewed)
        : null,
      relevance: location?.relevance,
      language: location?.language
    }))
    .sort((l1, l2) => l1.relevance < l2.relevance);
