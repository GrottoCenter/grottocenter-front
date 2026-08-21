import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postCommentUrl,
  putCommentUrl,
  deleteCommentUrl,
  restoreCommentUrl,
  moveCommentRelevanceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPatch, apiDelete } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';
import { minutesToDurationString } from '../../utils/dateTimeDuration';

// Comments carry two duration fields the UI stores in minutes but the API
// expects as ISO-8601 duration strings — the old thunks did the conversion,
// hooks keep it colocated here so the caller passes minutes as-is.
const withDurations = ({ eTTrail, eTUnderground, ...rest }) => ({
  ...rest,
  eTTrail: minutesToDurationString(eTTrail) ?? null,
  eTUnderground: minutesToDurationString(eTUnderground) ?? null
});

const useCommentMutation = mutationFn => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: entranceKeys.all })
  });
};

export const useCreateComment = () =>
  useCommentMutation(({ entrance, ...rest }) =>
    apiPost(postCommentUrl, { entrance, ...withDurations(rest) })
  );

export const useUpdateComment = () =>
  useCommentMutation(({ id, ...rest }) =>
    apiPatch(putCommentUrl(id), withDurations(rest))
  );

export const useDeleteComment = () =>
  useCommentMutation(({ id, isPermanent }) =>
    apiDelete(deleteCommentUrl(id, isPermanent))
  );

export const useRestoreComment = () =>
  useCommentMutation(({ id }) => apiPost(restoreCommentUrl(id)));

export const useMoveCommentRelevance = () =>
  useCommentMutation(({ id, direction }) =>
    apiPatch(moveCommentRelevanceUrl(id), { direction })
  );
