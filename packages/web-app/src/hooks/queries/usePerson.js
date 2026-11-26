import { useQuery } from '@tanstack/react-query';

import { getCaverUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { personKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

/**
 * The public profile of a caver / person.
 *
 * Admin flows send the auth header (via apiGet) so the API can widen the
 * returned fields; anonymous consumers get the trimmed public shape.
 *
 * @param {number|string} personId
 * @param {{ staleTime?: number }} [options] `staleTime` overrides the default
 *   freshness window, for views showing counters that change outside the app
 *   (e.g. failed login attempts on the admin user page).
 */
export const usePerson = (personId, { staleTime = STALE.STANDARD } = {}) =>
  useQuery({
    queryKey: personKeys.detail(personId),
    queryFn: () => apiGet(`${getCaverUrl}${personId}`),
    enabled: Boolean(personId),
    staleTime
  });

export default usePerson;
