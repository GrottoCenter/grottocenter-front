import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postHistoryUrl,
  putHistoryUrl,
  deleteHistoryUrl,
  restoreHistoryUrl,
  moveHistoryRelevanceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut, apiPatch, apiDelete } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';

const useHistoryMutation = mutationFn => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: entranceKeys.all })
  });
};

export const useCreateHistory = () =>
  useHistoryMutation(({ entrance, title, body, language }) =>
    apiPost(postHistoryUrl, { entrance, title, body, language })
  );

export const useUpdateHistory = () =>
  useHistoryMutation(({ id, title, body, language }) =>
    apiPut(putHistoryUrl(id), { title, body, language })
  );

export const useDeleteHistory = () =>
  useHistoryMutation(({ id, isPermanent }) =>
    apiDelete(deleteHistoryUrl(id, isPermanent))
  );

export const useRestoreHistory = () =>
  useHistoryMutation(({ id }) => apiPost(restoreHistoryUrl(id)));

export const useMoveHistoryRelevance = () =>
  useHistoryMutation(({ id, direction }) =>
    apiPatch(moveHistoryRelevanceUrl(id), { direction })
  );
