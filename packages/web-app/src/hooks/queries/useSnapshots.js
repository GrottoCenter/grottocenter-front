import { useQuery } from '@tanstack/react-query';

import { getSnapshotsUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { snapshotKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

// The snapshots endpoint returns 404 for entities that have no history yet.
// That is a legitimate empty state, not an error — swallow it here so the
// consumer sees `data === {}` rather than an error, mirroring the legacy
// SnapshotReducer behaviour.
const fetchSnapshots = url =>
  apiGet(url).catch(error => {
    if (error?.status === 404) return {};
    throw error;
  });

/**
 * Revision history for a given entity (entrance / cave / massif / …).
 *
 * `refetchOnMount: 'always'` mirrors the legacy SnapshotReducer contract:
 * every edit/rollback creates a new revision on the server, and no CRUD
 * mutation currently invalidates snapshotKeys, so we refetch on every mount
 * of a History tab (cached data shows immediately, background fetch keeps
 * the list current).
 *
 * @param {number|string} typeId  parent entity id
 * @param {string}        typeName parent entity type (plural, matches the URL segment)
 * @param {object}        [opts]   { isNetwork, getAll }
 */
export const useSnapshots = (typeId, typeName, opts = {}) => {
  const { isNetwork, getAll } = opts;
  return useQuery({
    queryKey: snapshotKeys.list(typeId, typeName, { isNetwork, getAll }),
    queryFn: () =>
      fetchSnapshots(getSnapshotsUrl(typeId, typeName, isNetwork, getAll)),
    enabled: Boolean(typeId && typeName),
    staleTime: STALE.STANDARD,
    refetchOnMount: 'always'
  });
};

export default useSnapshots;
