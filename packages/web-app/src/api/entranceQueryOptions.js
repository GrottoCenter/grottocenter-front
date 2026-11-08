import { getEntranceUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { apiGet } from './client';
import { entranceKeys } from './queryKeys';

export const entranceQueryOptions = entranceId => ({
  queryKey: entranceKeys.detail(entranceId),
  queryFn: () => apiGet(`${getEntranceUrl}${entranceId}`),
  enabled: Boolean(entranceId),
  staleTime: STALE.STANDARD
});
