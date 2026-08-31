import { useQuery } from '@tanstack/react-query';

import { apiGetWithRange } from '../../api/client';
import { guidelineKeys } from '../../api/queryKeys';
import { makeUrl, getTotalCount } from '../../actions/utils';
import { getGuidelinesUrl } from '../../conf/apiRoutes';
import { STALE } from '../../conf/queryClient';

const selectGuidelines = ({ data, contentRange }) => {
  const guidelines = (Array.isArray(data) ? data : []).filter(
    guideline => !guideline.isDeleted
  );
  return {
    guidelines,
    totalCount: getTotalCount(guidelines.length, contentRange)
  };
};

export const useGuidelines = (opts = {}) => {
  const { limit = 20, skip = 0 } = opts;
  const criteria = { limit: Math.min(limit, 100), skip };

  return useQuery({
    queryKey: guidelineKeys.list(criteria),
    queryFn: () => apiGetWithRange(makeUrl(getGuidelinesUrl, criteria)),
    select: selectGuidelines,
    staleTime: STALE.VOLATILE
  });
};

export default useGuidelines;
