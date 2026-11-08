import { useMutation, useQueryClient } from '@tanstack/react-query';

import associateAll from '@/api/associateAll';
import { associateDocumentToMassifUrl } from '../../conf/apiRoutes';
import { apiPut, apiDelete } from '../../api/client';
import { documentKeys, massifKeys } from '../../api/queryKeys';

const invalidateMassifDocuments = (queryClient, massifId, documentIds) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: massifKeys.detail(massifId)
    }),
    ...documentIds.map(documentId =>
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(documentId)
      })
    )
  ]);

const linkDocuments = (massifId, documents) =>
  associateAll(documents, document =>
    associateDocumentToMassifUrl(massifId, document.id)
  );

/** Associate an existing document with a massif. */
export const useLinkDocumentToMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ massifId, document }) =>
      apiPut(associateDocumentToMassifUrl(massifId, document.id)),
    onSuccess: (_data, { massifId, document }) =>
      invalidateMassifDocuments(queryClient, massifId, [document.id])
  });
};

/** Associate several existing documents, then refresh the final server state. */
export const useLinkDocumentsToMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ massifId, documents }) => linkDocuments(massifId, documents),
    onSettled: (_data, _error, { massifId, documents }) =>
      invalidateMassifDocuments(
        queryClient,
        massifId,
        documents.map(document => document.id)
      )
  });
};

/** Break the association between a document and a massif. */
export const useUnlinkDocumentToMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ massifId, documentId }) =>
      apiDelete(associateDocumentToMassifUrl(massifId, documentId)),
    onSuccess: (_data, { massifId, documentId }) =>
      invalidateMassifDocuments(queryClient, massifId, [documentId])
  });
};
