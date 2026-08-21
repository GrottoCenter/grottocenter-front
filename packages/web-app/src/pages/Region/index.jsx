import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import Region from '../../components/appli/Region';
import {
  usePermissions,
  useRegion,
  useSubscribeToRegion,
  useUnsubscribeFromRegion
} from '../../hooks';
import { regionKeys } from '../../api/queryKeys';

const RegionPage = () => {
  const { countryId, regionId } = useParams();
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const {
    data: region,
    error,
    isFetching,
    isPaused
  } = useRegion(countryId, regionId);
  const subscribeMutation = useSubscribeToRegion();
  const unsubscribeMutation = useUnsubscribeFromRegion();
  const onSubscribe = () => subscribeMutation.mutate({ countryId, regionId });
  const onUnsubscribe = () =>
    unsubscribeMutation.mutate({ countryId, regionId });
  const canSubscribe = permissions.isLeader;

  const reloadRegion = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: regionKeys.detail(countryId, regionId)
      }),
    [queryClient, countryId, regionId]
  );

  return (
    <Region
      key={`${countryId}-${regionId}`}
      canSubscribe={canSubscribe}
      region={region}
      error={error}
      isPaused={isPaused}
      isFetching={isFetching}
      onRetry={reloadRegion}
      onSubscribe={onSubscribe}
      onUnsubscribe={onUnsubscribe}
      countryId={countryId}
      regionId={regionId}
    />
  );
};

export default RegionPage;
