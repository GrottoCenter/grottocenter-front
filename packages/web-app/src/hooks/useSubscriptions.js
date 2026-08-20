import { useCallback } from 'react';
import { useIsMutating } from '@tanstack/react-query';

import { useUserProperties } from './useUserProperties';
import { useSubscriptionsList } from './queries/useSubscriptionsList';

// Any concurrent (subscribe|unsubscribe) mutation targeting one of the six
// endpoints registers under mutationKey xxx-subscription so useIsMutating
// can report a per-domain loading flag without threading each mutation
// object into every caller. Kept module-scoped so the identity is stable.
const isMutatingBy =
  key =>
  ({ mutation }) =>
    mutation.options.mutationKey?.[0] === key;

/**
 * Consumer-facing subscription helper.
 *
 * Returns the raw list plus an isSubscribed(id) test that treats any of
 * country/region/massif membership as a match — the callers just need to
 * know whether the entity is on the user's watch list, not by which type.
 *
 * The is*Loading flags aggregate all in-flight mutations targeting the
 * corresponding domain, so the button's disabled state doesn't need to
 * know which specific mutation it triggered.
 */
export const useSubscriptions = () => {
  const userProperties = useUserProperties();
  const caverId = userProperties?.id;
  const {
    data: subscriptions,
    isPending,
    isError
  } = useSubscriptionsList(caverId);

  const isSubscribed = useCallback(
    id => {
      if (!subscriptions) return false;
      return (
        subscriptions.countries?.some(c => c.id === id) ||
        subscriptions.regions?.some(r => r.id === id) ||
        subscriptions.massifs?.some(m => m.id === id)
      );
    },
    [subscriptions]
  );

  return {
    subscriptions,
    isSubscribed,
    // Exposed so callers can differentiate "still fetching" from "fetch
    // failed" — `!subscriptions` collapses both into a permanent spinner
    // and hides SubscriptionsList's error branch from users.
    isPending,
    isError,
    isCountryLoading:
      useIsMutating({ predicate: isMutatingBy('country-subscription') }) > 0,
    isRegionLoading:
      useIsMutating({ predicate: isMutatingBy('region-subscription') }) > 0,
    isMassifLoading:
      useIsMutating({ predicate: isMutatingBy('massif-subscription') }) > 0
  };
};
