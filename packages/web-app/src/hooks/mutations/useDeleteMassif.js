import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteMassifUrl } from '../../conf/apiRoutes';
import { apiDelete } from '../../api/client';
import { massifKeys, statsKeys } from '../../api/queryKeys';

export const useDeleteMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteMassifUrl(id, { entityId, isPermanent })),
    onSuccess: (_data, { id, isPermanent }) => {
      if (isPermanent) {
        queryClient.removeQueries({ queryKey: massifKeys.detail(id) });
      } else {
        queryClient.invalidateQueries({ queryKey: massifKeys.detail(id) });
      }
      // Country's nb_massifs and every downstream aggregate depend on the
      // massif being live — invalidate the whole stats domain.
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    }
  });
};

export default useDeleteMassif;
