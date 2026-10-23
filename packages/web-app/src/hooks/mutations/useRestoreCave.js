import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateAll } from '@/utils/mapTileCache';
import { completeEntityRestoration } from '@/utils/entityDeletionCache';

import { restoreCaveUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { caveKeys } from '../../api/queryKeys';

export const useRestoreCave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id }) => apiPost(restoreCaveUrl(id)),
    onSuccess: async (data, variables) => {
      await completeEntityRestoration(queryClient, caveKeys, data, variables);
      invalidateAll('networks');
    }
  });
};

export default useRestoreCave;
