import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost, apiPatch, apiDelete } from '@/api/client';
import associateAll from '@/api/associateAll';
import { documentKeys, pointKeys } from '@/api/queryKeys';
import { pointsUrl, pointUrl, pointDocumentUrl } from '@/conf/apiRoutes';

const usePointMutation = mutationFn => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pointKeys.all })
  });
};

export const useCreatePoint = () =>
  usePointMutation(body => apiPost(pointsUrl, body));

export const useUpdatePoint = () =>
  usePointMutation(({ id, ...body }) => apiPatch(pointUrl(id), body));

export const useDeletePoint = () =>
  usePointMutation(({ id }) => apiDelete(pointUrl(id)));

const invalidateDocuments = (queryClient, pointId, documentIds) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: pointKeys.detail(pointId) }),
    ...documentIds.map(id =>
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) })
    )
  ]);

export const useLinkDocumentsToPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pointId, documents }) =>
      associateAll(documents, document =>
        pointDocumentUrl(pointId, document.id)
      ),
    onSettled: (_data, _error, { pointId, documents }) =>
      invalidateDocuments(
        queryClient,
        pointId,
        documents.map(d => d.id)
      )
  });
};

export const useUnlinkDocumentFromPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pointId, documentId }) =>
      apiDelete(pointDocumentUrl(pointId, documentId)),
    onSuccess: (_data, { pointId, documentId }) =>
      invalidateDocuments(queryClient, pointId, [documentId])
  });
};
