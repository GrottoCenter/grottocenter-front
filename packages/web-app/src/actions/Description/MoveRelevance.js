import { moveDescriptionRelevanceUrl } from '../../conf/apiRoutes';
import createMoveRelevanceAction from '../createMoveRelevanceAction';

const { MOVE, SUCCESS, FAILURE, thunk } = createMoveRelevanceAction(
  'DESCRIPTION',
  moveDescriptionRelevanceUrl,
  'description'
);

export const MOVE_DESCRIPTION_RELEVANCE = MOVE;
export const MOVE_DESCRIPTION_RELEVANCE_SUCCESS = SUCCESS;
export const MOVE_DESCRIPTION_RELEVANCE_FAILURE = FAILURE;
export const moveDescriptionRelevance = thunk;
