import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  putCountryOrganizationUrl,
  deleteCountryOrganizationUrl,
  putRegionOrganizationUrl,
  deleteRegionOrganizationUrl,
  putMassifOrganizationUrl,
  deleteMassifOrganizationUrl
} from '../../conf/apiRoutes';
import { apiPut, apiDelete } from '../../api/client';
import {
  countryKeys,
  massifKeys,
  organizationKeys,
  regionKeys
} from '../../api/queryKeys';
import { invalidateAll } from '../../utils/mapTileCache';

// Creation is handled by the shared related-entity dialog. Associations only
// accept an existing ID so a failed link can be retried without creating again.
const requireOrganizationId = organizationId => {
  if (organizationId == null || organizationId === '')
    throw new Error('Organization ID is missing');
  return organizationId;
};

// Every association mutation invalidates the organization tile cache: the new
// association changes the org's linked geographies, and the map projection is
// fed by /geoloc — RQ invalidation alone would leave the marker set stale.
const invalidateOrgKeys = queryClient => {
  queryClient.invalidateQueries({ queryKey: organizationKeys.all });
  invalidateAll('organizations');
};

// Country, region and massif details all live in React Query — each hook
// invalidates its parent detail key on success.
export const useSetCountryOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ countryId, organizationId }) =>
      apiPut(
        putCountryOrganizationUrl(
          countryId,
          requireOrganizationId(organizationId)
        )
      ),
    onSuccess: (_data, { countryId }) => {
      queryClient.invalidateQueries({
        queryKey: countryKeys.detail(countryId)
      });
      invalidateOrgKeys(queryClient);
    }
  });
};

export const useRemoveCountryOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ countryId, organizationId }) =>
      apiDelete(deleteCountryOrganizationUrl(countryId, organizationId)),
    onSuccess: (_data, { countryId }) => {
      queryClient.invalidateQueries({
        queryKey: countryKeys.detail(countryId)
      });
      invalidateOrgKeys(queryClient);
    }
  });
};

export const useSetRegionOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ countryId, regionId, organizationId }) =>
      apiPut(
        putRegionOrganizationUrl(
          countryId,
          regionId,
          requireOrganizationId(organizationId)
        )
      ),
    onSuccess: (_data, { countryId, regionId }) => {
      queryClient.invalidateQueries({
        queryKey: regionKeys.detail(countryId, regionId)
      });
      invalidateOrgKeys(queryClient);
    }
  });
};

export const useRemoveRegionOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ countryId, regionId, organizationId }) =>
      apiDelete(
        deleteRegionOrganizationUrl(countryId, regionId, organizationId)
      ),
    onSuccess: (_data, { countryId, regionId }) => {
      queryClient.invalidateQueries({
        queryKey: regionKeys.detail(countryId, regionId)
      });
      invalidateOrgKeys(queryClient);
    }
  });
};

export const useSetMassifOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ massifId, organizationId }) =>
      apiPut(
        putMassifOrganizationUrl(
          massifId,
          requireOrganizationId(organizationId)
        )
      ),
    onSuccess: (_data, { massifId }) => {
      queryClient.invalidateQueries({ queryKey: massifKeys.detail(massifId) });
      invalidateOrgKeys(queryClient);
    }
  });
};

export const useRemoveMassifOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ massifId, organizationId }) =>
      apiDelete(deleteMassifOrganizationUrl(massifId, organizationId)),
    onSuccess: (_data, { massifId }) => {
      queryClient.invalidateQueries({ queryKey: massifKeys.detail(massifId) });
      invalidateOrgKeys(queryClient);
    }
  });
};
