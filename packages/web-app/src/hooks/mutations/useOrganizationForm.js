import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateOrganizationCaches } from '@/utils/organizationCache';
import { postOrganizationUrl, putOrganizationUrl } from '../../conf/apiRoutes';
import { apiPost, apiPut } from '../../api/client';

// Organizations show up on the global map, so every write invalidates the
// organizations tile cache in addition to the RQ cache — the map is fed by
// /geoloc, not by the entity endpoint, so RQ invalidation alone would leave
// the marker stale.
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: body => apiPost(postOrganizationUrl, body),
    onSuccess: () => invalidateOrganizationCaches(queryClient)
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: body => apiPut(putOrganizationUrl(body.id), body),
    onSuccess: () => invalidateOrganizationCaches(queryClient)
  });
};
