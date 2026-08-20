import { useMutation, useQueryClient } from '@tanstack/react-query';

import { restoreEntranceUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';

export const useRestoreEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiPost(restoreEntranceUrl(id)),
    onSuccess: (_data, { id }) =>
      queryClient.invalidateQueries({ queryKey: entranceKeys.detail(id) })
  });
};

export default useRestoreEntrance;
