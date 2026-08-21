import { useQuery } from '@tanstack/react-query';

import {
  getBannedCaversUrl,
  getGroupsUrl,
  getInvalidEmailCaversUrl
} from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { listKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

// Admin-facing lists that back the ManageUsers page. Enabled-gated so a
// non-admin visiting a route that mounts the hook makes no request.

export const useGroups = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: listKeys.groups(),
    queryFn: () => apiGet(getGroupsUrl),
    enabled,
    staleTime: STALE.STANDARD
  });

export const useBannedCavers = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: listKeys.bannedCavers(),
    queryFn: async () => {
      const data = await apiGet(getBannedCaversUrl);
      // Defensive: legacy API sometimes returns { banned: undefined }; the
      // reducer noisily warned about that shape. Expose an empty array in
      // that case so consumers can render `[]` without a crash.
      return data?.banned ?? [];
    },
    enabled,
    staleTime: STALE.STANDARD
  });

export const useInvalidEmailCavers = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: listKeys.invalidEmailCavers(),
    queryFn: async () => {
      const data = await apiGet(getInvalidEmailCaversUrl);
      return data?.cavers ?? [];
    },
    enabled,
    staleTime: STALE.STANDARD
  });
