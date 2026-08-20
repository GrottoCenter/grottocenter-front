import { useMutation, useQueryClient } from '@tanstack/react-query';

import { processDocumentIdsUrl } from '../../conf/apiRoutes';
import { apiPut } from '../../api/client';
import {
  countKeys,
  documentKeys,
  entranceKeys,
  massifKeys,
  organizationKeys,
  personKeys
} from '../../api/queryKeys';

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
      // Validation applies pending author/organization/massif relations. Their
      // detail payloads embed documents, and the API returns no relation diff,
      // so each affected domain has to be invalidated by prefix.
      queryClient.invalidateQueries({ queryKey: entranceKeys.all });
      queryClient.invalidateQueries({ queryKey: massifKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      queryClient.invalidateQueries({ queryKey: personKeys.all });
    }
  });
};

export default useProcessDocuments;
