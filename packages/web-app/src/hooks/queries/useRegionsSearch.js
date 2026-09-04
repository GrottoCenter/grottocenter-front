import { useQuery } from '@tanstack/react-query';

import { regionsSearchUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { regionKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

// ISO region OR-search backing the document form's multiple-region select.
// Endpoint is a POST-based search (not RESTful GET), so the queryKey folds
// the query text in place of a URL path — matches the pre-migration slice
// that keyed cache by the last submitted query.
export const useRegionsSearch = (query, opts = {}) => {
  const { enabled = true } = opts;
  const trimmed = (query ?? '').trim();
  return useQuery({
    queryKey: [...regionKeys.all, 'search', trimmed],
    queryFn: async () => {
      const data = await apiPost(regionsSearchUrl, { query: trimmed });
      return data?.results ?? [];
    },
    enabled: enabled && trimmed.length >= 1,
    staleTime: STALE.VOLATILE
  });
};

export default useRegionsSearch;
