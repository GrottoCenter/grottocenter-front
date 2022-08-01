import { pathOr } from 'ramda';
import getAuthor from '../../util/getAuthor';

// eslint-disable-next-line import/prefer-default-export
export const getSafeData = data => ({
  altitude: data.altitude,
  author: getAuthor(data?.author),
  creationDate: data.inscriptionDate,
  depth: data.depth,
  length: data.length,
  descriptions: data.descriptions,
  discoveryYear: data.discoveryYear,
  entrances: pathOr([], ['entrances'], data),
  id: data.id,
  isDivingCave: data.isDiving,
  massif: pathOr(undefined, ['massifs', 0], data),
  massifs: data.massifs,
  name: data.name,
  names: data.names,
  temperature: data.temperature,
  undergroundType: pathOr(null, ['massif', 'undergroundType'], data)
});
