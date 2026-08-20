import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteDocumentUrl } from '../../conf/apiRoutes';
import { apiDelete } from '../../api/client';
import { documentKeys } from '../../api/queryKeys';

/**
 * Soft‑delete or permanently delete a document.
 *
 * Soft delete: the API returns the document with `isDeleted:true`, we
 * invalidate the detail so the page refetches and re-renders the deleted
 * card. Permanent: the page navigates away right after the mutation, and we
 * evict the cache entry outright so a later browse won't pull a ghost.
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteDocumentUrl(id, { entityId, isPermanent })),
    onSuccess: (_data, { id, isPermanent }) => {
      if (isPermanent) {
        queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      } else {
        queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      }
    }
  });
};

export default useDeleteDocument;
