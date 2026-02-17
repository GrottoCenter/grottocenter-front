import { moveHistoryRelevanceUrl } from '../../conf/apiRoutes';
import createMoveRelevanceAction from '../createMoveRelevanceAction';

const { MOVE, SUCCESS, FAILURE, thunk } = createMoveRelevanceAction(
  'HISTORY',
  moveHistoryRelevanceUrl,
  'history'
);

export const MOVE_HISTORY_RELEVANCE = MOVE;
export const MOVE_HISTORY_RELEVANCE_SUCCESS = SUCCESS;
export const MOVE_HISTORY_RELEVANCE_FAILURE = FAILURE;
export const moveHistoryRelevance = thunk;
