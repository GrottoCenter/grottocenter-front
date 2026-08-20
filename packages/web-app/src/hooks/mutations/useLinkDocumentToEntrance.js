import { useMutation, useQueryClient } from '@tanstack/react-query';

import { associateDocumentToEntranceUrl } from '../../conf/apiRoutes';
import { apiPut, apiDelete } from '../../api/client';
import { documentKeys, entranceKeys } from '../../api/queryKeys';

const invalidateEntranceDocuments = (queryClient, entranceId, documentIds) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: entranceKeys.detail(entranceId)
    }),
    ...documentIds.map(documentId =>
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(documentId)
      })
    )
  ]);

const linkDocuments = async (entranceId, documents) => {
  // Wait for every request before invalidating. Promise.all would reject on the
  // first failure while the remaining writes were still running, allowing a
  // refetch to observe only part of the final server state.
  const results = await Promise.allSettled(
    documents.map(document =>
      apiPut(associateDocumentToEntranceUrl(entranceId, document.id))
    )
  );
  const rejections = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);
  if (rejections.length > 0) {
    // Rethrow the first reason so existing notifiers keep working, but expose
    // the full list so callers/notifiers can count and describe every failure.
    const error = rejections[0];
    error.rejections = rejections;
    throw error;
  }
  return results.map(result => result.value);
};

export const useLinkDocumentToEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entranceId, document }) =>
      apiPut(associateDocumentToEntranceUrl(entranceId, document.id)),
    onSuccess: (_data, { entranceId, document }) =>
      invalidateEntranceDocuments(queryClient, entranceId, [document.id])
  });
};

export const useLinkDocumentsToEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entranceId, documents }) =>
      linkDocuments(entranceId, documents),
    onSettled: (_data, _error, { entranceId, documents }) =>
      invalidateEntranceDocuments(
        queryClient,
        entranceId,
        documents.map(document => document.id)
      )
  });
};

export const useUnlinkDocumentToEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entranceId, documentId }) =>
      apiDelete(associateDocumentToEntranceUrl(entranceId, documentId)),
    onSuccess: (_data, { entranceId, documentId }) =>
      invalidateEntranceDocuments(queryClient, entranceId, [documentId])
  });
};
