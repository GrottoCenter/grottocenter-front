import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteEntranceUrl } from '../../conf/apiRoutes';
import { apiDelete } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';
import { invalidateAll } from '../../utils/mapTileCache';

// Soft- or permanently delete an entrance. Both entrance and network tile
// caches are invalidated: an entrance removal changes both projections.
export const useDeleteEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteEntranceUrl(id, { entityId, isPermanent })),
    onSuccess: (_data, { id, isPermanent }) => {
      if (isPermanent) {
        queryClient.removeQueries({ queryKey: entranceKeys.detail(id) });
      } else {
        queryClient.invalidateQueries({ queryKey: entranceKeys.detail(id) });
      }
      invalidateAll('entrances');
      invalidateAll('networks');
    }
  });
};

export default useDeleteEntrance;
