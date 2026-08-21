import { useQuery } from '@tanstack/react-query';

import {
  getForCarouselUrl,
  getRandomEntranceUrl,
  getRecentChanges
} from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { listKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

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

export const useRecentChanges = () =>
  useQuery({
    queryKey: listKeys.recentChanges(),
    queryFn: async () => {
      const data = await apiGet(getRecentChanges);
      return data?.changes ?? [];
    },
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
