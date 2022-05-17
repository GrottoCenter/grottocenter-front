import { pathOr } from 'ramda';

import { getAuthor } from '../Entry/transformers';

// eslint-disable-next-line import/prefer-default-export
export const getSafeData = data => ({
  altitude: data.altitude,
  author: getAuthor(data?.author),
  creationDate: pathOr(null, ['dateInscription'], data),
  depth: pathOr(0, ['depth'], data),
  length: pathOr(0, ['length'], data),
  descriptions: data.descriptions,
  discoveryYear: pathOr(null, ['discoveryYear'], data),
  entrances: pathOr([], ['entrances'], data),
  id: data.id,
  isDivingCave: pathOr(null, ['isDiving'], data),
  massif: pathOr(null, ['massif'], data),
  name: data.name,
  temperature: pathOr(null, ['temperature'], data),
  undergroundType: pathOr(null, ['massif', 'undergroundType'], data)
});
