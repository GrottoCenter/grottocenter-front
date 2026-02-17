import { moveLocationRelevanceUrl } from '../../conf/apiRoutes';
import createMoveRelevanceAction from '../createMoveRelevanceAction';

const { MOVE, SUCCESS, FAILURE, thunk } = createMoveRelevanceAction(
  'LOCATION',
  moveLocationRelevanceUrl,
  'location'
);

export const MOVE_LOCATION_RELEVANCE = MOVE;
export const MOVE_LOCATION_RELEVANCE_SUCCESS = SUCCESS;
export const MOVE_LOCATION_RELEVANCE_FAILURE = FAILURE;
export const moveLocationRelevance = thunk;
