import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeEntityDeletion } from '@/utils/entityDeletionCache';

import { deleteMassifUrl } from '../../conf/apiRoutes';
import { apiDelete } from '../../api/client';
import { massifKeys } from '../../api/queryKeys';

export const useDeleteMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteMassifUrl(id, { entityId, isPermanent })),
    onSuccess: (data, variables) =>
      completeEntityDeletion(queryClient, massifKeys, data, variables)
  });
};

export default useDeleteMassif;
