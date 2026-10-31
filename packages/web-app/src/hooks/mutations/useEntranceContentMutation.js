import { useMutation, useQueryClient } from '@tanstack/react-query';

import { entranceKeys } from '@/api/queryKeys';

export const useEntranceContentMutation = (
  mutationFn,
  { isInline = false } = {}
) => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: isInline ? { errorPresentation: 'inline' } : undefined,
    networkMode: isInline ? 'always' : undefined,
    mutationFn,
    onSuccess: () => {
      const invalidation = queryClient.invalidateQueries({
        queryKey: entranceKeys.all
      });
      // Inline deletion/restoration succeeds even if the background refresh fails.
      return isInline ? undefined : invalidation;
    }
  });
};
