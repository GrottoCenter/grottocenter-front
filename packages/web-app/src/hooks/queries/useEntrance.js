import { useQuery } from '@tanstack/react-query';

import { getEntranceUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

/** The full detail payload of an entrance. */
export const useEntrance = entranceId =>
  useQuery({
    queryKey: entranceKeys.detail(entranceId),
    queryFn: () => apiGet(`${getEntranceUrl}${entranceId}`),
    enabled: Boolean(entranceId),
    staleTime: STALE.STANDARD
  });

export default useEntrance;
