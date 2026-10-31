import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeEntityDeletion } from '@/utils/entityDeletionCache';

import { deleteCaveUrl } from '../../conf/apiRoutes';
import { apiDelete } from '../../api/client';
import { caveKeys } from '../../api/queryKeys';
import { invalidateAll } from '../../utils/mapTileCache';

// Soft- or permanently delete a cave. The `networks` tile cache is invalidated
// alongside the RQ cache — the map projection is fed by /geoloc, not by the
// cave endpoint, so RQ invalidation alone would leave the marker stale.
export const useDeleteCave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteCaveUrl(id, { entityId, isPermanent })),
    onSuccess: async (data, variables) => {
      await completeEntityDeletion(queryClient, caveKeys, data, variables);
      invalidateAll('networks');
    }
  });
};

export default useDeleteCave;
