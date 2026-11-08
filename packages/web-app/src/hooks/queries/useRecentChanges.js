import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/api/client';
import { listKeys } from '@/api/queryKeys';
import { makeUrl } from '@/actions/utils';
import { getRecentChanges } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import {
  getRecentChangeKey,
  getRecentChangesFilters,
  RECENT_CHANGES_CONFIG
} from '@/utils/recentChanges';

const fetchRecentChangesPage = async ({ offset, limit, filters }) => {
  // Probe one extra group to detect another page. The API applies the scope
  // before capping raw operations within its lookback window.
  const data = await apiGet(
    makeUrl(getRecentChanges, { offset, limit: limit + 1, ...filters })
  );
  const changes = data?.changes ?? [];
  return {
    changes: changes.slice(0, limit),
    hasMore: changes.length > limit,
    nextOffset: offset + Math.min(changes.length, limit)
  };
};

const selectRecentChangesPreview = page => page.changes;

const selectRecentChangesFeed = data => {
  const knownKeys = new Set();
  const changes = data.pages.flatMap(page =>
    page.changes.filter(change => {
      const key = getRecentChangeKey(change);
      if (knownKeys.has(key)) return false;
      knownKeys.add(key);
      return true;
    })
  );
  return { ...data, changes };
};

export const useRecentChanges = ({
  limit = RECENT_CHANGES_CONFIG.previewLimit,
  filters = {}
} = {}) => {
  const normalizedFilters = getRecentChangesFilters(filters);
  return useQuery({
    queryKey: listKeys.recentChanges({
      limit,
      mode: 'preview',
      filters: normalizedFilters
    }),
    queryFn: () =>
      fetchRecentChangesPage({ offset: 0, limit, filters: normalizedFilters }),
    select: selectRecentChangesPreview,
    staleTime: STALE.STANDARD
  });
};

export const useRecentChangesFeed = ({
  limit = RECENT_CHANGES_CONFIG.pageSize,
  filters = {}
} = {}) => {
  const normalizedFilters = getRecentChangesFilters(filters);
  return useInfiniteQuery({
    queryKey: listKeys.recentChanges({
      limit,
      mode: 'feed',
      filters: normalizedFilters
    }),
    queryFn: ({ pageParam }) =>
      fetchRecentChangesPage({
        offset: pageParam,
        limit,
        filters: normalizedFilters
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    select: selectRecentChangesFeed,
    staleTime: STALE.STANDARD
  });
};
