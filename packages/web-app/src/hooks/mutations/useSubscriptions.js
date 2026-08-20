import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';

import {
  subscribeToCountryUrl,
  subscribeToMassifUrl,
  subscribeToRegionUrl,
  unsubscribeFromCountryUrl,
  unsubscribeFromMassifUrl,
  unsubscribeFromRegionUrl
} from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { subscriptionKeys } from '../../api/queryKeys';
import { useNotification } from '../useNotification';

// Every subscribe/unsubscribe mutation invalidates the subscriptions list.
// Success snackbars are emitted inline (replacing the old
// useReducerSuccessNotification pattern) so each mutation stays a
// self-contained "click → server → user feedback" unit.
// mutationKey lets useSubscriptions expose per-domain isLoading flags via
// useIsMutating without piping each mutation object through props.
const useSubscriptionMutation = ({
  mutationKey,
  mutationFn,
  successMessageId
}) => {
  const queryClient = useQueryClient();
  const { onSuccess: notifySuccess } = useNotification();
  const { formatMessage } = useIntl();
  return useMutation({
    mutationKey: [mutationKey],
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      notifySuccess(formatMessage({ id: successMessageId }));
    }
  });
};

// The unsubscribe endpoints accept a moderator-supplied userId (via query
// string) so an admin can drop someone else's subscription. Callers pass
// { userId } — undefined means "operate on the current user".
const urlWithMaybeUser = (base, userId) =>
  userId ? `${base}?userId=${userId}` : base;

export const useSubscribeToCountry = () =>
  useSubscriptionMutation({
    mutationKey: 'country-subscription',
    mutationFn: ({ countryId }) => apiPost(subscribeToCountryUrl(countryId)),
    successMessageId: 'You are subscribed to the country.'
  });

export const useUnsubscribeFromCountry = () =>
  useSubscriptionMutation({
    mutationKey: 'country-subscription',
    mutationFn: ({ countryId, userId }) =>
      apiPost(urlWithMaybeUser(unsubscribeFromCountryUrl(countryId), userId)),
    successMessageId: 'You are unsubscribed from the country.'
  });

export const useSubscribeToRegion = () =>
  useSubscriptionMutation({
    mutationKey: 'region-subscription',
    mutationFn: ({ countryId, regionId }) =>
      apiPost(subscribeToRegionUrl(countryId, regionId)),
    successMessageId: 'You are subscribed to the region.'
  });

export const useUnsubscribeFromRegion = () =>
  useSubscriptionMutation({
    mutationKey: 'region-subscription',
    mutationFn: ({ countryId, regionId, userId }) =>
      apiPost(
        urlWithMaybeUser(unsubscribeFromRegionUrl(countryId, regionId), userId)
      ),
    successMessageId: 'You are unsubscribed from the region.'
  });

export const useSubscribeToMassif = () =>
  useSubscriptionMutation({
    mutationKey: 'massif-subscription',
    mutationFn: ({ massifId }) => apiPost(subscribeToMassifUrl(massifId)),
    successMessageId: 'You are subscribed to the massif.'
  });

export const useUnsubscribeFromMassif = () =>
  useSubscriptionMutation({
    mutationKey: 'massif-subscription',
    mutationFn: ({ massifId, userId }) =>
      apiPost(urlWithMaybeUser(unsubscribeFromMassifUrl(massifId), userId)),
    successMessageId: 'You are unsubscribed from the massif.'
  });
