import { useMutation, useQueryClient } from '@tanstack/react-query';

import { associateDocumentToEntranceUrl } from '../../conf/apiRoutes';
import { apiPut, apiDelete } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';

export const useLinkDocumentToEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entranceId, document }) =>
      apiPut(associateDocumentToEntranceUrl(entranceId, document.id)),
    onSuccess: (_data, { entranceId }) =>
      queryClient.invalidateQueries({
        queryKey: entranceKeys.detail(entranceId)
      })
  });
};

export const useUnlinkDocumentToEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entranceId, documentId }) =>
      apiDelete(associateDocumentToEntranceUrl(entranceId, documentId)),
    onSuccess: (_data, { entranceId }) =>
      queryClient.invalidateQueries({
        queryKey: entranceKeys.detail(entranceId)
      })
  });
};
