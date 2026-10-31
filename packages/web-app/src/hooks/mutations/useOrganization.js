import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateOrganizationCaches } from '@/utils/organizationCache';
import {
  completeEntityDeletion,
  completeEntityRestoration
} from '@/utils/entityDeletionCache';
import {
  deleteOrganizationUrl,
  restoreOrganizationUrl,
  joinOrganizationUrl,
  leaveOrganizationUrl,
  linkCaveToOrganizationUrl,
  unlinkCaveFromOrganizationUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut, apiDelete } from '../../api/client';
import {
  organizationKeys,
  personKeys,
  snapshotKeys,
  statsKeys
} from '../../api/queryKeys';

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteOrganizationUrl(id, { entityId, isPermanent })),
    onSuccess: async (data, variables) => {
      await completeEntityDeletion(
        queryClient,
        organizationKeys,
        data,
        variables,
        [snapshotKeys.all, statsKeys.all]
      );
      invalidateOrganizationCaches(
        queryClient,
        organizationKeys.detail(variables.id)
      );
    }
  });
};

export const useRestoreOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id }) => apiPost(restoreOrganizationUrl(id)),
    onSuccess: async (data, variables) => {
      await completeEntityRestoration(
        queryClient,
        organizationKeys,
        data,
        variables,
        [snapshotKeys.all, statsKeys.all]
      );
      invalidateOrganizationCaches(
        queryClient,
        organizationKeys.detail(variables.id)
      );
    }
  });
};

// Join / leave touch a caver's organizations list AND the organization's
// members list — invalidate both domains so pages/Person and pages/Organization
// (whichever is mounted) refetch.
const invalidatePersonAndOrganization = (
  queryClient,
  caverId,
  organizationId
) => {
  queryClient.invalidateQueries({
    queryKey: organizationKeys.detail(organizationId)
  });
  queryClient.invalidateQueries({ queryKey: personKeys.detail(caverId) });
};

export const useJoinOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caverId, organizationId }) =>
      apiPut(joinOrganizationUrl(caverId, organizationId)),
    onSuccess: (_data, { caverId, organizationId }) =>
      invalidatePersonAndOrganization(queryClient, caverId, organizationId)
  });
};

export const useLeaveOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caverId, organizationId }) =>
      apiDelete(leaveOrganizationUrl(caverId, organizationId)),
    onSuccess: (_data, { caverId, organizationId }) =>
      invalidatePersonAndOrganization(queryClient, caverId, organizationId)
  });
};

// Cave <-> organization linkage. Reading side (organization.exploredNetworks)
// lives on the org detail; refresh it after either side of the write.
export const useLinkCaveToOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caveId, organizationId }) =>
      apiPut(linkCaveToOrganizationUrl(caveId, organizationId)),
    onSuccess: (_data, { organizationId }) =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(organizationId)
      })
  });
};

export const useUnlinkCaveFromOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caveId, organizationId }) =>
      apiDelete(unlinkCaveFromOrganizationUrl(caveId, organizationId)),
    onSuccess: (_data, { organizationId }) =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(organizationId)
      })
  });
};
