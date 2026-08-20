import { useMutation, useQuery } from '@tanstack/react-query';

import { substancesUrl, substancesSearchUrl } from '../../conf/apiRoutes';
import { apiGet, apiPost } from '../../api/client';
import { substanceKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

const EMPTY = [];

/**
 * Autocomplete search for substances. The caller debounces its input and
 * passes a trimmed term; the hook is disabled below two characters, matching
 * the legacy thunk's contract.
 *
 * The queryFn does not swallow errors — non-401 failures surface a toast via
 * the QueryClient's global onError. Callers still get an empty options list
 * because we default `data` to EMPTY, so a transient failure never wedges the
 * autocomplete on a stale list.
 *
 * @param {string} term - trimmed search term (>= 2 chars)
 * @returns {{ data: Array, isFetching: boolean, error: unknown }}
 */
export const useSubstanceSearch = term => {
  const trimmed = term ? term.trim() : '';
  const enabled = trimmed.length >= 2;
  const query = useQuery({
    queryKey: substanceKeys.search(trimmed),
    queryFn: () => apiGet(substancesSearchUrl(trimmed)),
    enabled,
    staleTime: STALE.VOLATILE
  });
  return { ...query, data: query.data ?? EMPTY };
};

/**
 * Create (or find existing) substance. The endpoint returns the existing row
 * on a duplicate name (200) or the newly-created one (201) — both are the
 * same shape from the caller's perspective, so no branching is needed here.
 */
export const useCreateSubstance = () =>
  useMutation({
    mutationFn: data => apiPost(substancesUrl, data)
  });
