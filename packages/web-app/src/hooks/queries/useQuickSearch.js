import { useQuery } from '@tanstack/react-query';

import { quickSearchUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { quicksearchKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';
import { AUTOCOMPLETE_MIN_CHARACTERS } from '../../conf/config';

/**
 * Autocomplete-style search. Each caller passes its own `(query, entities,
 * filter)`; the queryKey isolates callers so parallel autocompletes never
 * clobber each other (the legacy single-slice behaviour).
 *
 * The query is gated on `minChars` so a one-letter input never fires — matches
 * the legacy behaviour of every consumer.
 */
export const useQuickSearch = ({
  query,
  entities,
  filter,
  enabled = true,
  minChars = AUTOCOMPLETE_MIN_CHARACTERS
}) => {
  const trimmed = (query ?? '').trim();
  const effectiveFilter = filter ?? {};
  return useQuery({
    queryKey: quicksearchKeys.results({
      query: trimmed,
      entities,
      filter: effectiveFilter
    }),
    queryFn: () =>
      apiPost(quickSearchUrl, {
        query: trimmed,
        entities,
        filter: effectiveFilter
      }),
    enabled: enabled && trimmed.length >= minChars,
    staleTime: STALE.VOLATILE
  });
};

export default useQuickSearch;
