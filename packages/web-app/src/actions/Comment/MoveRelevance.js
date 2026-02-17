import { moveCommentRelevanceUrl } from '../../conf/apiRoutes';
import createMoveRelevanceAction from '../createMoveRelevanceAction';

const { MOVE, SUCCESS, FAILURE, thunk } = createMoveRelevanceAction(
  'COMMENT',
  moveCommentRelevanceUrl,
  'comment'
);

export const MOVE_COMMENT_RELEVANCE = MOVE;
export const MOVE_COMMENT_RELEVANCE_SUCCESS = SUCCESS;
export const MOVE_COMMENT_RELEVANCE_FAILURE = FAILURE;
export const moveCommentRelevance = thunk;
