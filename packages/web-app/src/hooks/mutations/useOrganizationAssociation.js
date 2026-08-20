import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';

import {
  postOrganizationUrl,
  putCountryOrganizationUrl,
  deleteCountryOrganizationUrl,
  putRegionOrganizationUrl,
  deleteRegionOrganizationUrl,
  putMassifOrganizationUrl,
  deleteMassifOrganizationUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut, apiDelete } from '../../api/client';
import { countryKeys, massifKeys, organizationKeys } from '../../api/queryKeys';
import { invalidateAll } from '../../utils/mapTileCache';
import { fetchRegion } from '../../actions/Region/GetRegion';

// The AssociationForm accepts either an existing organization (organizationId)
// or a free-text organizationName. In the second case we first POST a new
// organization to obtain its id, then PUT the association — same chain as the
// legacy thunks. Kept here so consumers still call a single mutation.
const resolveOrganizationId = async ({ organizationId, organizationName }) => {
  if (organizationId) return organizationId;
  if (!organizationName) throw new Error('Organization ID is missing');
  const created = await apiPost(postOrganizationUrl, {
    name: { text: organizationName, language: 'en' }
  });
  return created.id;
};

// Every association mutation invalidates the organization tile cache: the new
// association changes the org's linked geographies, and the map projection is
// fed by /geoloc — RQ invalidation alone would leave the marker set stale.
const invalidateOrgKeys = queryClient => {
  queryClient.invalidateQueries({ queryKey: organizationKeys.all });
  invalidateAll('organizations');
};

// Region details are still a Redux slice (migrating in B4). Until then the
// region set/remove hooks dispatch the legacy fetch action to refresh that
// slice; country and massif both invalidate their RQ detail key directly.
export const useSetCountryOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ countryId, organizationId, organizationName }) => {
      const finalOrgId = await resolveOrganizationId({
        organizationId,
        organizationName
      });
      return apiPut(putCountryOrganizationUrl(countryId, finalOrgId));
    },
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
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: async ({
      countryId,
      regionId,
      organizationId,
      organizationName
    }) => {
      const finalOrgId = await resolveOrganizationId({
        organizationId,
        organizationName
      });
      return apiPut(putRegionOrganizationUrl(countryId, regionId, finalOrgId));
    },
    onSuccess: (_data, { countryId, regionId }) => {
      dispatch(fetchRegion(countryId, regionId));
      invalidateOrgKeys(queryClient);
    }
  });
};

export const useRemoveRegionOrganization = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: ({ countryId, regionId, organizationId }) =>
      apiDelete(
        deleteRegionOrganizationUrl(countryId, regionId, organizationId)
      ),
    onSuccess: (_data, { countryId, regionId }) => {
      dispatch(fetchRegion(countryId, regionId));
      invalidateOrgKeys(queryClient);
    }
  });
};

export const useSetMassifOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ massifId, organizationId, organizationName }) => {
      const finalOrgId = await resolveOrganizationId({
        organizationId,
        organizationName
      });
      return apiPut(putMassifOrganizationUrl(massifId, finalOrgId));
    },
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
