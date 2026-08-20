import { useQuery } from '@tanstack/react-query';

import { getMassifUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { massifKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

/** The full detail payload of a massif. */
export const useMassif = massifId =>
  useQuery({
    queryKey: massifKeys.detail(massifId),
    queryFn: () => apiGet(`${getMassifUrl}${massifId}`),
    enabled: Boolean(massifId),
    staleTime: STALE.STANDARD
  });

export default useMassif;
