import { useQuery } from '@tanstack/react-query';

import { getOrganizationUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { organizationKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

export const useOrganization = organizationId =>
  useQuery({
    queryKey: organizationKeys.detail(organizationId),
    queryFn: () => apiGet(`${getOrganizationUrl}${organizationId}`),
    enabled: Boolean(organizationId),
    staleTime: STALE.STANDARD
  });

export default useOrganization;
