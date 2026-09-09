import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetWithRange } from '../../api/client';
import { guidelineKeys } from '../../api/queryKeys';
import { makeUrl, getTotalCount } from '../../actions/utils';
import { getGuidelinesUrl, getGuidelineUrl } from '../../conf/apiRoutes';
import { STALE } from '../../conf/queryClient';

const selectGuidelines = ({ data, contentRange }) => {
  const guidelines = Array.isArray(data) ? data : [];
  return {
    guidelines,
    totalCount: getTotalCount(guidelines.length, contentRange)
  };
};

export const useGuidelines = (opts = {}) => {
  const { limit = 20, skip = 0, enabled = true } = opts;
  const criteria = { limit: Math.min(limit, 100), skip };

  return useQuery({
    queryKey: guidelineKeys.list(criteria),
    queryFn: () => apiGetWithRange(makeUrl(getGuidelinesUrl, criteria)),
    select: selectGuidelines,
    enabled,
    staleTime: STALE.VOLATILE
  });
};

export const useGuideline = id =>
  useQuery({
    queryKey: guidelineKeys.detail(id),
    queryFn: () => apiGet(getGuidelineUrl(id)),
    enabled: id != null && id !== '',
    staleTime: STALE.STANDARD
  });

export default useGuidelines;
