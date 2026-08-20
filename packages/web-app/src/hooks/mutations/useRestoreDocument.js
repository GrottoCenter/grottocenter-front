import { useMutation, useQueryClient } from '@tanstack/react-query';

import { restoreDocumentUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { documentKeys } from '../../api/queryKeys';

/** Undo a soft delete; invalidates the detail so the page refetches. */
export const useRestoreDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiPost(restoreDocumentUrl(id)),
    onSuccess: (_data, { id }) =>
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) })
  });
};

export default useRestoreDocument;
