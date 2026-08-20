import { useQuery } from '@tanstack/react-query';

import { getCaveUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { caveKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

/** The full detail payload of a cave (a.k.a. network on the routes). */
export const useCave = caveId =>
  useQuery({
    queryKey: caveKeys.detail(caveId),
    queryFn: () => apiGet(`${getCaveUrl}${caveId}`),
    enabled: Boolean(caveId),
    staleTime: STALE.STANDARD
  });

export default useCave;
