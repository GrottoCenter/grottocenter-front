import { useQuery } from '@tanstack/react-query';

import { getRegionUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { regionKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

export const useRegion = (countryId, regionId) =>
  useQuery({
    queryKey: regionKeys.detail(countryId, regionId),
    queryFn: () => apiGet(getRegionUrl(countryId, regionId)),
    enabled: Boolean(countryId && regionId),
    staleTime: STALE.STANDARD
  });

export default useRegion;
