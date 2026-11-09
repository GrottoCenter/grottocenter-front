import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';

import { apiGet } from '@/api/client';
import { entranceKeys } from '@/api/queryKeys';
import { getEntranceUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';

const getFreshDetail = state => {
  if (
    !state?.data ||
    !('featuredFile' in state.data) ||
    state.isInvalidated ||
    Date.now() - state.dataUpdatedAt >= STALE.STANDARD
  )
    return undefined;
  return state;
};

const toFeaturedImage = ({
  id,
  name,
  isDeleted,
  redirectTo,
  featuredFile
}) => ({
  id,
  name,
  isDeleted,
  redirectTo,
  featuredFile
});

/** Popup metadata has its own cache and never fills the full detail cache. */
export const useEntranceFeaturedImage = (
  entranceId,
  { enabled = true } = {}
) => {
  const queryClient = useQueryClient();
  const subscribe = useCallback(
    listener => queryClient.getQueryCache().subscribe(listener),
    [queryClient]
  );
  const getSnapshot = useCallback(
    () => queryClient.getQueryState(entranceKeys.detail(entranceId)),
    [queryClient, entranceId]
  );
  // A disabled detail observer does not report invalidation. Subscribe to its
  // state so borrowed data is replaced immediately when that cache changes.
  const detailState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const detail = getFreshDetail(detailState);
  const select = useCallback(
    data =>
      detail && getFreshDetail(getSnapshot())
        ? toFeaturedImage(detail.data)
        : data,
    [detail, getSnapshot]
  );
  return useQuery({
    queryKey: entranceKeys.featuredImage(entranceId),
    queryFn: () => apiGet(`${getEntranceUrl}${entranceId}/featured-image`),
    // Borrow detail without copying it or extending its original freshness.
    placeholderData: detail ? toFeaturedImage(detail.data) : undefined,
    select,
    // Recheck at refetch time too: invalidating the detail prefix must enable
    // this read even if fresh detail disabled it when the popup first opened.
    enabled: () =>
      enabled && Boolean(entranceId) && !getFreshDetail(getSnapshot()),
    staleTime: STALE.STANDARD,
    meta: { skipErrorNotification: true }
  });
};
