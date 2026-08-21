import { useMutation, useQueryClient } from '@tanstack/react-query';

import { patchNameUrl } from '../../conf/apiRoutes';
import { apiPatch } from '../../api/client';
import { caveKeys, entranceKeys, massifKeys } from '../../api/queryKeys';

// Names belong to any of the three entities that have a "names" collection
// (cave, entrance, massif) — the API doesn't return which, so invalidate
// all three. Only the currently mounted entity refetches in practice.
export const useUpdateName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: data => apiPatch(patchNameUrl(data.id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caveKeys.all });
      queryClient.invalidateQueries({ queryKey: entranceKeys.all });
      queryClient.invalidateQueries({ queryKey: massifKeys.all });
    }
  });
};

export default useUpdateName;
