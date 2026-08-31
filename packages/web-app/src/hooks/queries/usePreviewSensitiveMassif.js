import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { previewMassifSensitiveUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { massifPreviewKeys } from '../../api/queryKeys';

/**
 * Imperative preview of how many entrances would be marked sensitive if a
 * moderator confirms the toggle. Used inline before opening the confirmation
 * dialog (not a declarative `useQuery` because the fetch is triggered by a
 * user gesture, not a mount).
 *
 * fetchQuery goes through the QueryClient so the response is cached under
 * massifPreviewKeys.sensitive(id). The preview deliberately remains stale so
 * every confirmation fetches current counts; the key still deduplicates
 * concurrent requests and routes errors through the global onError.
 *
 * @returns {(massifId: number) => Promise<{count: number, lockedCount: number}>}
 */
export const usePreviewSensitiveMassif = () => {
  const queryClient = useQueryClient();
  return useCallback(
    massifId =>
      queryClient
        .fetchQuery({
          queryKey: massifPreviewKeys.sensitive(massifId),
          queryFn: () => apiGet(previewMassifSensitiveUrl(massifId))
        })
        .then(data => ({
          count: data?.count ?? 0,
          lockedCount: data?.lockedCount ?? 0
        })),
    [queryClient]
  );
};

export default usePreviewSensitiveMassif;
