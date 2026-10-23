import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeEntityRestoration } from '@/utils/entityDeletionCache';

import { restoreMassifUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { massifKeys } from '../../api/queryKeys';

export const useRestoreMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id }) => apiPost(restoreMassifUrl(id)),
    onSuccess: (data, variables) =>
      completeEntityRestoration(queryClient, massifKeys, data, variables)
  });
};

export default useRestoreMassif;
