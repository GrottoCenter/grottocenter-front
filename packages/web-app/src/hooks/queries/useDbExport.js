import { useQuery } from '@tanstack/react-query';

import { getDbExportUrls } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { moderationKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

// The DB export archive is regenerated on a slow cadence server-side, so a
// long staleTime is fine — but the dashboard is the only reader, and a fresh
// visit should see the latest run.
export const useDbExport = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: moderationKeys.dbExport(),
    queryFn: () => apiGet(getDbExportUrls),
    enabled,
    staleTime: STALE.STANDARD
  });

export default useDbExport;
