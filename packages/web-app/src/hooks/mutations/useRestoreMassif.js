import { useMutation, useQueryClient } from '@tanstack/react-query';

import { restoreMassifUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { massifKeys, statsKeys } from '../../api/queryKeys';

export const useRestoreMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiPost(restoreMassifUrl(id)),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: massifKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    }
  });
};

export default useRestoreMassif;
