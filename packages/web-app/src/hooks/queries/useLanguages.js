import { useQuery } from '@tanstack/react-query';

import { getLanguagesUrl } from '../../conf/apiRoutes';
import { makeUrl } from '../../actions/utils';
import { apiGet } from '../../api/client';
import { referenceKeys } from '../../api/queryKeys';
import { REFERENCE_QUERY } from '../../conf/queryClient';

// Module scope: see the note in useFileFormats about `select` identity.
//
// Copies before sorting — `select` receives the cached array itself, and sorting
// it in place would mutate what every other observer of this query reads. The
// reducer this replaces did exactly that to its action payload.
//
// localeCompare, where the reducer passed `(a, b) => a.refName > b.refName`:
// that returns a boolean, so it never yields -1 and never really sorted. The
// displayed order changes as a result.
const byRefName = languages =>
  [...languages].sort((a, b) => a.refName.localeCompare(b.refName));

/**
 * The languages a document can be written in, sorted by display name.
 *
 * Always restricted to the preferred set: no caller has ever needed the full
 * list, and threading a `false` through here — and through the query key —
 * would be dead weight. Add a `useAllLanguages` hook the day it is needed.
 */
export const useLanguages = () =>
  useQuery({
    queryKey: referenceKeys.languages(),
    queryFn: async () =>
      (await apiGet(makeUrl(getLanguagesUrl, { isPreferedLanguage: true })))
        .languages,
    select: byRefName,
    ...REFERENCE_QUERY
  });

export default useLanguages;
