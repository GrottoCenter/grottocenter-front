import {
  postCommentUrl,
  putCommentUrl,
  deleteCommentUrl,
  restoreCommentUrl,
  moveCommentRelevanceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPatch, apiDelete } from '../../api/client';
import { minutesToDurationString } from '../../utils/dateTimeDuration';
import { useEntranceContentMutation } from './useEntranceContentMutation';

// Comments carry two duration fields the UI stores in minutes but the API
// expects as ISO-8601 duration strings — the old thunks did the conversion,
// hooks keep it colocated here so the caller passes minutes as-is.
const withDurations = ({ eTTrail, eTUnderground, ...rest }) => ({
  ...rest,
  eTTrail: minutesToDurationString(eTTrail) ?? null,
  eTUnderground: minutesToDurationString(eTUnderground) ?? null
});

export const useCreateComment = () =>
  useEntranceContentMutation(({ entrance, ...rest }) =>
    apiPost(postCommentUrl, { entrance, ...withDurations(rest) })
  );

export const useUpdateComment = () =>
  useEntranceContentMutation(({ id, ...rest }) =>
    apiPatch(putCommentUrl(id), withDurations(rest))
  );

export const useDeleteComment = () =>
  useEntranceContentMutation(
    ({ id, isPermanent }) => apiDelete(deleteCommentUrl(id, isPermanent)),
    { isInline: true }
  );

export const useRestoreComment = () =>
  useEntranceContentMutation(({ id }) => apiPost(restoreCommentUrl(id)), {
    isInline: true
  });

export const useMoveCommentRelevance = () =>
  useEntranceContentMutation(({ id, direction }) =>
    apiPatch(moveCommentRelevanceUrl(id), { direction })
  );
