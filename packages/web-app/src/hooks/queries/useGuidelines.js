import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetWithRange } from '../../api/client';
import { guidelineKeys } from '../../api/queryKeys';
import { makeUrl, getTotalCount } from '../../actions/utils';
import { getGuidelinesUrl, getGuidelineUrl } from '../../conf/apiRoutes';
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

const FALLBACK_PAGE_SIZE = 100;

const findGuidelineInCurrentList = async id => {
  const findInPage = async skip => {
    const { data, contentRange } = await apiGetWithRange(
      makeUrl(getGuidelinesUrl, { limit: FALLBACK_PAGE_SIZE, skip })
    );
    const guidelines = Array.isArray(data) ? data : [];
    const guideline = guidelines.find(
      item => !item.isDeleted && String(item.id) === String(id)
    );
    if (guideline) return guideline;

    const totalCount = getTotalCount(guidelines.length, contentRange);
    const nextSkip = skip + FALLBACK_PAGE_SIZE;
    return nextSkip < totalCount ? findInPage(nextSkip) : null;
  };

  return findInPage(0);
};

const fetchGuideline = async id => {
  try {
    return await apiGet(getGuidelineUrl(id));
  } catch (error) {
    if (error.status !== 404 && error.status !== 405) throw error;

    // TODO(api#1782): remove this paginated-list fallback once
    // GET /api/v1/guidelines/:id is deployed. The future endpoint also returns
    // hydrated country/region/massif names, while today's list only guarantees
    // codes and massif IDs. It is also required after soft deletion: the list
    // fallback excludes deleted guidelines, so the deleted detail cannot be
    // reloaded or restored from its dedicated page until that GET exists.
    const guideline = await findGuidelineInCurrentList(id);
    if (guideline) return guideline;
    throw error;
  }
};

export const useGuideline = id =>
  useQuery({
    queryKey: guidelineKeys.detail(id),
    queryFn: () => fetchGuideline(id),
    enabled: id != null && id !== '',
    staleTime: STALE.STANDARD
  });

export default useGuidelines;
