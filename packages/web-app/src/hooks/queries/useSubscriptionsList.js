import { useQuery } from '@tanstack/react-query';

import { getSubscriptionsUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { subscriptionKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

// Raw list of country/region/massif subscriptions for a caver. Public hook is
// useSubscriptions in ../useSubscriptions.js — it wraps this with the
// isSubscribed helper the callers rely on.
export const useSubscriptionsList = caverId =>
  useQuery({
    queryKey: subscriptionKeys.list(caverId),
    queryFn: async () => {
      const data = await apiGet(getSubscriptionsUrl(caverId));
      return data?.subscriptions ?? { countries: [], regions: [], massifs: [] };
    },
    enabled: Boolean(caverId),
    staleTime: STALE.STANDARD
  });
