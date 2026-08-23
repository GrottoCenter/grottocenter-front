import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getForCarouselUrl,
  getRandomEntranceUrl,
  getRecentChanges
} from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { listKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';
import { makeUrl } from '../../actions/utils';
import { getRecentChangeKey } from '../../utils/recentChanges';

// Homepage cards (random entrance, recent changes, partner carousel) and
// the news feed. All are anonymous GETs served fast by the API; STANDARD
// staleTime is fine — a homepage reload every few minutes catches new
// content without hammering the server.

export const useRandomEntrance = () =>
  useQuery({
    queryKey: listKeys.randomEntrance(),
    queryFn: () => apiGet(getRandomEntranceUrl),
    // A new random pick every time makes no sense (RQ would treat every
    // remount as "already fresh"); this query is intentionally sticky per
    // page load and the card exposes an onRefresh to force a new pick.
    staleTime: STALE.STANDARD
  });

const fetchRecentChangesPage = async ({ offset, limit }) => {
  const data = await apiGet(
    makeUrl(getRecentChanges, { offset, limit: limit + 1 })
  );
  const changes = data?.changes ?? [];
  return {
    changes: changes.slice(0, limit),
    hasMore: changes.length > limit,
    nextOffset: offset + Math.min(changes.length, limit)
  };
};

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

export const useRecentChanges = ({ limit = 10 } = {}) =>
  useQuery({
    queryKey: listKeys.recentChanges({ limit, mode: 'preview' }),
    queryFn: () => fetchRecentChangesPage({ offset: 0, limit }),
    select: page => page.changes,
    staleTime: STALE.STANDARD
  });

export const useRecentChangesFeed = ({ limit = 50 } = {}) =>
  useInfiniteQuery({
    queryKey: listKeys.recentChanges({ limit, mode: 'feed' }),
    queryFn: ({ pageParam }) =>
      fetchRecentChangesPage({ offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    select: selectRecentChangesFeed,
    staleTime: STALE.STANDARD
  });

export const usePartnersCarousel = () =>
  useQuery({
    queryKey: listKeys.partnersCarousel(),
    queryFn: async () => {
      const data = await apiGet(getForCarouselUrl);
      return data?.organization ?? [];
    },
    staleTime: STALE.STANDARD
  });

/**
 * External blog news feed. Legacy shape returned a JSON string that the
 * reducer parsed a second time (`JSON.parse(action.news)`); apiGet already
 * parses, so this hook returns the object directly.
 */
export const useLatestBlogNews = url =>
  useQuery({
    queryKey: listKeys.latestBlogNews(url),
    queryFn: () => apiGet(url),
    enabled: Boolean(url),
    staleTime: STALE.STANDARD
  });
