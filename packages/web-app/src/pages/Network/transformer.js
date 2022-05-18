import { pathOr } from 'ramda';

import { getAuthor } from '../Entry/transformers';

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
  massif: data.massif,
  name: data.name,
  names: data.names,
  temperature: data.temperature,
  undergroundType: pathOr(null, ['massif', 'undergroundType'], data)
});
