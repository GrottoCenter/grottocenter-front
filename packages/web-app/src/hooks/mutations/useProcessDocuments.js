import { useMutation, useQueryClient } from '@tanstack/react-query';

import { processDocumentIdsUrl } from '../../conf/apiRoutes';
import { apiPut } from '../../api/client';
import { countKeys, documentKeys } from '../../api/queryKeys';

// Moderator batch validate/reject on the pending-documents queue. Refreshes
// both the pending count badge (in AppBar + Dashboard) and any mounted
// document list so the processed rows disappear from the queue.
export const useProcessDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isValidated, comment }) => {
      const documents = (ids ?? []).map(id => ({
        id,
        isValidated: String(isValidated),
        validationComment: comment
      }));
      return apiPut(processDocumentIdsUrl, { documents });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: countKeys.pendingDocuments()
      });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    }
  });
};

export default useProcessDocuments;
