import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';

import Country from '../../components/appli/Country';
import { useCountry, usePermissions, useUserProperties } from '../../hooks';
import { countryKeys } from '../../api/queryKeys';
import { fetchSubscriptions } from '../../actions/Subscriptions/GetSubscriptions';
import { subscribeToCountry } from '../../actions/Subscriptions/SubscribeToCountry';
import { unsubscribeFromCountry } from '../../actions/Subscriptions/UnsubscribeFromCountry';

const CountryPage = () => {
  const { id: countryId } = useParams();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const userProperties = useUserProperties();
  const permissions = usePermissions();
  const { data: country, error, isFetching, isPaused } = useCountry(countryId);
  const onSubscribe = () => dispatch(subscribeToCountry(countryId));
  const onUnsubscribe = () => dispatch(unsubscribeFromCountry(countryId));
  const canSubscribe = permissions.isLeader;

  const reloadCountry = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: countryKeys.detail(countryId)
      }),
    [queryClient, countryId]
  );

  useEffect(() => {
    if (permissions.isAuth) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, countryId]);

  return (
    <Country
      key={countryId}
      canSubscribe={canSubscribe}
      country={country}
      error={error}
      isPaused={isPaused}
      isFetching={isFetching}
      onRetry={reloadCountry}
      onSubscribe={onSubscribe}
      onUnsubscribe={onUnsubscribe}
    />
  );
};
export default CountryPage;
