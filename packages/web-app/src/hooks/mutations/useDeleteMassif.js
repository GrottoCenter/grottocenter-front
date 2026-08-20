import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteMassifUrl } from '../../conf/apiRoutes';
import { apiDelete } from '../../api/client';
import { massifKeys } from '../../api/queryKeys';

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
    }
  });
};

export default useDeleteMassif;
