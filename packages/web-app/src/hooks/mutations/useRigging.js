import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postRiggingsUrl,
  putRiggingsUrl,
  deleteRiggingsUrl,
  restoreRiggingsUrl,
  moveRiggingRelevanceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPatch, apiDelete } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';

const useRiggingMutation = mutationFn => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: entranceKeys.all })
  });
};

export const useCreateRigging = () =>
  useRiggingMutation(({ entrance, title, obstacles, language }) =>
    apiPost(postRiggingsUrl, { entrance, title, obstacles, language })
  );

export const useUpdateRigging = () =>
  useRiggingMutation(({ id, title, obstacles, language }) =>
    apiPatch(putRiggingsUrl(id), { title, obstacles, language })
  );

export const useDeleteRigging = () =>
  useRiggingMutation(({ id, isPermanent }) =>
    apiDelete(deleteRiggingsUrl(id, isPermanent))
  );

export const useRestoreRigging = () =>
  useRiggingMutation(({ id }) => apiPost(restoreRiggingsUrl(id)));

export const useMoveRiggingRelevance = () =>
  useRiggingMutation(({ id, direction }) =>
    apiPatch(moveRiggingRelevanceUrl(id), { direction })
  );
