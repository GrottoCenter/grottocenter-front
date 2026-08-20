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
 */
export const usePerson = personId =>
  useQuery({
    queryKey: personKeys.detail(personId),
    queryFn: () => apiGet(`${getCaverUrl}${personId}`),
    enabled: Boolean(personId),
    staleTime: STALE.STANDARD
  });

export default usePerson;
