import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postDescriptionUrl,
  putDescriptionUrl,
  deleteDescriptionUrl,
  restoreDescriptionUrl,
  moveDescriptionRelevanceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPatch, apiDelete } from '../../api/client';
import { caveKeys, entranceKeys, massifKeys } from '../../api/queryKeys';

// A description belongs to exactly one of entrance / cave / massif, but the
// response payload does not always reliably surface which. Invalidating the
// three `all` keys is safe and cheap: React Query only refetches queries
// currently mounted, and typically only one entity view is on screen — so
// this resolves to a single refetch in practice.
const invalidateAllEntityDetails = queryClient => {
  queryClient.invalidateQueries({ queryKey: entranceKeys.all });
  queryClient.invalidateQueries({ queryKey: caveKeys.all });
  queryClient.invalidateQueries({ queryKey: massifKeys.all });
};

export const useCreateDescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entrance, cave, massif, title, body, language }) =>
      apiPost(postDescriptionUrl, {
        entrance,
        cave,
        massif,
        title,
        body,
        language
      }),
    onSuccess: () => invalidateAllEntityDetails(queryClient)
  });
};

export const useUpdateDescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, body, language }) =>
      apiPatch(putDescriptionUrl(id), { title, body, language }),
    onSuccess: () => invalidateAllEntityDetails(queryClient)
  });
};

export const useDeleteDescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPermanent }) =>
      apiDelete(deleteDescriptionUrl(id, isPermanent)),
    onSuccess: () => invalidateAllEntityDetails(queryClient)
  });
};

export const useRestoreDescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiPost(restoreDescriptionUrl(id)),
    onSuccess: () => invalidateAllEntityDetails(queryClient)
  });
};

/**
 * Move a description up (-1) or down (1) in its relevance order.
 *
 * Returns a mutation object; useMoveRelevanceWithUndo drives it with
 * `mutateAsync` to get the pattern's promise chain (initial move, undo).
 */
export const useMoveDescriptionRelevance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }) =>
      apiPatch(moveDescriptionRelevanceUrl(id), { direction }),
    onSuccess: () => invalidateAllEntityDetails(queryClient)
  });
};
