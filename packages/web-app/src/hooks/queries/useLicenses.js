import { useQuery } from '@tanstack/react-query';

import { getLicensesUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { referenceKeys } from '../../api/queryKeys';
import { REFERENCE_QUERY } from '../../conf/queryClient';

// Module scope: see the note in useFileFormats about `select` identity.
//
// Copies before sorting — `select` receives the cached array itself, and sorting
// it in place would mutate what every other observer of this query reads.
const byName = licenses =>
  [...licenses].sort((a, b) => a.name.localeCompare(b.name));

/**
 * The licenses a document can be published under, sorted by name.
 *
 * `enabled` lets a caller that only needs licenses in one branch of its UI keep
 * the call site unconditional — it replaces the `if (!licenses) dispatch(...)`
 * guards the consumers used to carry.
 *
 * @param {{ enabled?: boolean }} [options]
 */
export const useLicenses = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: referenceKeys.licenses(),
    queryFn: async () => (await apiGet(getLicensesUrl)).licenses,
    select: byName,
    enabled,
    ...REFERENCE_QUERY
  });

/**
 * Look up a license by its `name` field.
 *
 * Colocated with the hook: every caller that reads a license from documentData
 * needs it, and reinventing `licenses.find(l => l.name === x)` inline is what
 * this replaces. Returns undefined when the list has not loaded yet or the name
 * is unknown — same shape callers already handle.
 */
export const findLicenseByName = (licenses, name) =>
  licenses?.find(l => l.name === name);

export default useLicenses;
