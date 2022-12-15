import { pathOr } from 'ramda';
import getAuthor from '../../util/getAuthor';

// eslint-disable-next-line import/prefer-default-export
export const getSafeData = data => ({
  id: data.id,
  author: getAuthor(data?.author),
  reviewer: getAuthor(data?.reviewer),
  creationDate: data.dateInscription,
  reviewedDate: data.dateReviewed,
  altitude: data.altitude,
  depth: data.depth,
  length: data.length,
  latitude: data.latitude,
  longitude: data.longitude,
  temperature: data.temperature,
  isDivingCave: data.isDiving,
  descriptions: data.descriptions,
  entrances: data.entrances ?? [],
  massif: pathOr(undefined, ['massifs', 0], data),
  massifs: data.massifs,
  name: pathOr(data.name, ['names', 0, 'name'], data),
  names: data.names,
  undergroundType: pathOr(null, ['massif', 'undergroundType'], data),
  redirectTo: data.redirectTo
});
