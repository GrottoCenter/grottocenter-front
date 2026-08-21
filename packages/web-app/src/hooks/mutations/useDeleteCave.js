import { useMutation, useQueryClient } from '@tanstack/react-query';

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
