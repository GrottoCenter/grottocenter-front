import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeEntityRestoration } from '@/utils/entityDeletionCache';

import { restoreDocumentUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { documentKeys } from '../../api/queryKeys';

/** Undo a soft delete; invalidates the detail so the page refetches. */
export const useRestoreDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id }) => apiPost(restoreDocumentUrl(id)),
    onSuccess: (data, variables) =>
      completeEntityRestoration(queryClient, documentKeys, data, variables)
  });
};

export default useRestoreDocument;
