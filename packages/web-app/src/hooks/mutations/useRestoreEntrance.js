import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateAll } from '@/utils/mapTileCache';
import { completeEntityRestoration } from '@/utils/entityDeletionCache';

import { restoreEntranceUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';

export const useRestoreEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id }) => apiPost(restoreEntranceUrl(id)),
    onSuccess: async (data, variables) => {
      await completeEntityRestoration(
        queryClient,
        entranceKeys,
        data,
        variables
      );
      invalidateAll('entrances');
      invalidateAll('networks');
    }
  });
};

export default useRestoreEntrance;
