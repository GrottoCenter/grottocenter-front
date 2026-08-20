import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteCaveUrl } from '../../conf/apiRoutes';
import { apiDelete } from '../../api/client';
import { caveKeys } from '../../api/queryKeys';
import { invalidateAll } from '../../utils/mapTileCache';

/**
 * Soft- or permanently delete a cave.
 *
 * The map tile cache invalidation used to be triggered by
 * mapCacheInvalidationMiddleware on DELETE_CAVE_*_SUCCESS; the middleware
 * no longer sees a dispatch, so the invalidation lives here in the
 * mutation's onSuccess where the effect belongs.
 */
export const useDeleteCave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteCaveUrl(id, { entityId, isPermanent })),
    onSuccess: (_data, { id, isPermanent }) => {
      if (isPermanent) {
        queryClient.removeQueries({ queryKey: caveKeys.detail(id) });
      } else {
        queryClient.invalidateQueries({ queryKey: caveKeys.detail(id) });
      }
      invalidateAll('networks');
    }
  });
};

export default useDeleteCave;
