import { useMutation, useQueryClient } from '@tanstack/react-query';

import { associateDocumentToMassifUrl } from '../../conf/apiRoutes';
import { apiPut, apiDelete } from '../../api/client';
import { massifKeys } from '../../api/queryKeys';

/** Associate an existing document with a massif. */
export const useLinkDocumentToMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ massifId, document }) =>
      apiPut(associateDocumentToMassifUrl(massifId, document.id)),
    onSuccess: (_data, { massifId }) =>
      queryClient.invalidateQueries({
        queryKey: massifKeys.detail(massifId)
      })
  });
};

/** Break the association between a document and a massif. */
export const useUnlinkDocumentToMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ massifId, documentId }) =>
      apiDelete(associateDocumentToMassifUrl(massifId, documentId)),
    onSuccess: (_data, { massifId }) =>
      queryClient.invalidateQueries({
        queryKey: massifKeys.detail(massifId)
      })
  });
};
