import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeEntityDeletion } from '@/utils/entityDeletionCache';

import { deleteDocumentUrl } from '../../conf/apiRoutes';
import { apiDelete } from '../../api/client';
import { documentKeys } from '../../api/queryKeys';

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteDocumentUrl(id, { entityId, isPermanent })),
    onSuccess: (data, variables) =>
      completeEntityDeletion(queryClient, documentKeys, data, variables)
  });
};

export default useDeleteDocument;
