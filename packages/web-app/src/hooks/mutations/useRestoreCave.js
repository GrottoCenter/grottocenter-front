import { useMutation, useQueryClient } from '@tanstack/react-query';

import { restoreCaveUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { caveKeys } from '../../api/queryKeys';

export const useRestoreCave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiPost(restoreCaveUrl(id)),
    onSuccess: (_data, { id }) =>
      queryClient.invalidateQueries({ queryKey: caveKeys.detail(id) })
  });
};

export default useRestoreCave;
