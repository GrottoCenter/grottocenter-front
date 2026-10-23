import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeEntityDeletion } from '@/utils/entityDeletionCache';

import { deleteEntranceUrl } from '../../conf/apiRoutes';
import { apiDelete } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';
import { invalidateAll } from '../../utils/mapTileCache';

// Soft- or permanently delete an entrance. Both entrance and network tile
// caches are invalidated: an entrance removal changes both projections.
export const useDeleteEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteEntranceUrl(id, { entityId, isPermanent })),
    onSuccess: async (data, variables) => {
      await completeEntityDeletion(queryClient, entranceKeys, data, variables);
      invalidateAll('entrances');
      invalidateAll('networks');
    }
  });
};

export default useDeleteEntrance;
