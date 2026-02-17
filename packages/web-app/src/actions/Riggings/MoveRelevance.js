import { moveRiggingRelevanceUrl } from '../../conf/apiRoutes';
import createMoveRelevanceAction from '../createMoveRelevanceAction';

const { MOVE, SUCCESS, FAILURE, thunk } = createMoveRelevanceAction(
  'RIGGING',
  moveRiggingRelevanceUrl,
  'rigging'
);

export const MOVE_RIGGING_RELEVANCE = MOVE;
export const MOVE_RIGGING_RELEVANCE_SUCCESS = SUCCESS;
export const MOVE_RIGGING_RELEVANCE_FAILURE = FAILURE;
export const moveRiggingRelevance = thunk;
