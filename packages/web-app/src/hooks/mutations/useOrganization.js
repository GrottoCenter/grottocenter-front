import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  deleteOrganizationUrl,
  restoreOrganizationUrl,
  joinOrganizationUrl,
  leaveOrganizationUrl,
  linkCaveToOrganizationUrl,
  unlinkCaveFromOrganizationUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut, apiDelete } from '../../api/client';
import { organizationKeys, personKeys } from '../../api/queryKeys';
import { invalidateAll } from '../../utils/mapTileCache';

const invalidateOrganizationsAndMap = queryClient => {
  queryClient.invalidateQueries({ queryKey: organizationKeys.all });
  invalidateAll('organizations');
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entityId, isPermanent }) =>
      apiDelete(deleteOrganizationUrl(id, { entityId, isPermanent })),
    onSuccess: (_data, { id, isPermanent }) => {
      if (isPermanent) {
        queryClient.removeQueries({ queryKey: organizationKeys.detail(id) });
      } else {
        queryClient.invalidateQueries({
          queryKey: organizationKeys.detail(id)
        });
      }
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      invalidateAll('organizations');
    }
  });
};

export const useRestoreOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiPost(restoreOrganizationUrl(id)),
    onSuccess: () => invalidateOrganizationsAndMap(queryClient)
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
