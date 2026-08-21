import { useQuery } from '@tanstack/react-query';

import { fetchNotificationsUrl } from '../../conf/apiRoutes';
import { apiGetWithRange } from '../../api/client';
import { notificationKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';
import { getTotalCount, makeUrl } from '../../actions/utils';

// select() so the shape returned to consumers matches the legacy reducer
// (notifications + totalCount) — no downstream code has to know Content-Range
// exists. Kept at module scope so the identity is stable.
const selectList = ({ data, contentRange }) => ({
  notifications: data?.notifications ?? [],
  totalCount: getTotalCount(data?.notifications?.length ?? 0, contentRange)
});

/**
 * Paginated notifications list.
 * @param {{ limit?: number, skip?: number }} [opts]
 */
export const useNotifications = (opts = {}) => {
  const { limit = 50, skip = 0 } = opts;
  const criteria = { limit, skip };
  return useQuery({
    queryKey: notificationKeys.list(criteria),
    queryFn: () => apiGetWithRange(makeUrl(fetchNotificationsUrl, criteria)),
    select: selectList,
    staleTime: STALE.VOLATILE
  });
};

/**
 * Short list backing the AppBar dropdown. Same endpoint as
 * useNotifications, different queryKey so pagination on /notifications does
 * not evict the menu cache.
 *
 * `enabled` is required for the AppBar consumer: anonymous page loads must
 * not fire this GET or the 401 trips queryClient's postLogout handler.
 */
export const useMenuNotifications = (opts = {}) => {
  const { size = 10, enabled = true } = opts;
  const criteria = { size };
  return useQuery({
    queryKey: notificationKeys.menu(criteria),
    queryFn: () => apiGetWithRange(makeUrl(fetchNotificationsUrl, criteria)),
    enabled,
    select: selectList,
    staleTime: STALE.VOLATILE
  });
};

export default useNotifications;
