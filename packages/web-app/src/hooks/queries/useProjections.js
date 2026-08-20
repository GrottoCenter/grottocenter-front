import { useQuery } from '@tanstack/react-query';

import { getProjectionsUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { referenceKeys } from '../../api/queryKeys';
import { REFERENCE_QUERY } from '../../conf/queryClient';
import { registerProjections } from '../../helpers/coordinateTransform';

const EMPTY = [];

/**
 * The projections the coordinate widgets convert to.
 *
 * The registerProjections side effect lives in the queryFn rather than in a
 * consumer effect, so it fires atomically with the successful fetch and once
 * per fetch — proj4.defs is idempotent so re-registering on a refetch is
 * harmless. This replaces the reducer-side registration the Redux slice used
 * to do on FETCH_PROJECTIONS_SUCCESS.
 *
 * The old useProjections carried a useEffect guard on
 * `(projections === null && !loading)` — never on `error` — which made a
 * single API failure loop until /api/convert 429'd. React Query caches the
 * error so the queryFn does not fire again on its own.
 *
 * @returns {Array} projection objects; empty array while loading or on error
 */
const useProjections = () => {
  const { data } = useQuery({
    queryKey: referenceKeys.projections(),
    queryFn: async () => {
      const projections = await apiGet(getProjectionsUrl);
      registerProjections(projections);
      return projections;
    },
    ...REFERENCE_QUERY
  });

  return data ?? EMPTY;
};

export default useProjections;
