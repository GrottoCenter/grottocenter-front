import { useQuery } from '@tanstack/react-query';

import {
  countUnreadNotificationsUrl,
  getDocumentsUrl,
  getDuplicatesEntranceUrl
} from '../../conf/apiRoutes';
import { apiGet, apiGetWithRange } from '../../api/client';
import { countKeys, notificationKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';
import { getTotalCount, makeUrl } from '../../actions/utils';

// Badge counters. VOLATILE staleTime because the badge is what tells the
// moderator there is something new — a stale value would silently mask work
// that just landed. Each mutation that could change the count invalidates
// the relevant key, so this only guards the background window (tab focus).

export const useUnreadNotificationsCount = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const data = await apiGet(countUnreadNotificationsUrl);
      return data?.count ?? 0;
    },
    enabled,
    staleTime: STALE.VOLATILE
  });

// TODO: replace with GET /api/v1/documents/count-pending-validation once the
// API endpoint lands (GrottoCenter/grottocenter-api#1560). Until then the
// count is read from Content-Range of a 1-row page of the unvalidated list.
export const usePendingDocumentsCount = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: countKeys.pendingDocuments(),
    queryFn: async () => {
      const { contentRange } = await apiGetWithRange(
        makeUrl(getDocumentsUrl, { isValidated: false, limit: 1, skip: 0 })
      );
      return getTotalCount(0, contentRange);
    },
    enabled,
    staleTime: STALE.VOLATILE
  });

export const useDuplicatesCount = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: countKeys.duplicates(),
    queryFn: async () => {
      const { contentRange } = await apiGetWithRange(
        makeUrl(getDuplicatesEntranceUrl, { limit: 1, skip: 0 })
      );
      return getTotalCount(0, contentRange);
    },
    enabled,
    staleTime: STALE.VOLATILE
  });
