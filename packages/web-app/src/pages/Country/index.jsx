import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import Country from '../../components/appli/Country';
import {
  useCountry,
  usePermissions,
  useSubscribeToCountry,
  useUnsubscribeFromCountry
} from '../../hooks';
import { countryKeys } from '../../api/queryKeys';

const CountryPage = () => {
  const { id: countryId } = useParams();
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const { data: country, error, isFetching, isPaused } = useCountry(countryId);
  const subscribeMutation = useSubscribeToCountry();
  const unsubscribeMutation = useUnsubscribeFromCountry();
  const onSubscribe = () => subscribeMutation.mutate({ countryId });
  const onUnsubscribe = () => unsubscribeMutation.mutate({ countryId });
  const canSubscribe = permissions.isLeader;

  const reloadCountry = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: countryKeys.detail(countryId)
      }),
    [queryClient, countryId]
  );

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
