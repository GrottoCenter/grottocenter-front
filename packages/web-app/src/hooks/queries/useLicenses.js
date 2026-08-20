import { useQuery } from '@tanstack/react-query';

import { getLicensesUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { referenceKeys } from '../../api/queryKeys';
import { REFERENCE_QUERY } from '../../conf/queryClient';

/**
 * The licenses a document can be published under.
 *
 * `enabled` lets a caller that only needs licenses in one branch of its UI keep
 * the call site unconditional — it replaces the `if (!licenses) dispatch(...)`
 * guards the consumers used to carry.
 *
 * @param {boolean} [enabled=true]
 */
export const useLicenses = (enabled = true) =>
  useQuery({
    queryKey: referenceKeys.licenses(),
    queryFn: async () => (await apiGet(getLicensesUrl)).licenses,
    enabled,
    ...REFERENCE_QUERY
  });

export default useLicenses;
