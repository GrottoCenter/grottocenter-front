import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';

import Region from '../../components/appli/Region';
import { usePermissions, useRegion, useUserProperties } from '../../hooks';
import { regionKeys } from '../../api/queryKeys';
import { fetchSubscriptions } from '../../actions/Subscriptions/GetSubscriptions';
import { subscribeToRegion } from '../../actions/Subscriptions/SubscribeToRegion';
import { unsubscribeFromRegion } from '../../actions/Subscriptions/UnsubscribeFromRegion';

const RegionPage = () => {
  const { countryId, regionId } = useParams();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const userProperties = useUserProperties();
  const permissions = usePermissions();
  const {
    data: region,
    error,
    isFetching,
    isPaused
  } = useRegion(countryId, regionId);
  const onSubscribe = () => dispatch(subscribeToRegion(countryId, regionId));
  const onUnsubscribe = () =>
    dispatch(unsubscribeFromRegion(countryId, regionId));
  const canSubscribe = permissions.isLeader;

  const reloadRegion = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: regionKeys.detail(countryId, regionId)
      }),
    [queryClient, countryId, regionId]
  );

  useEffect(() => {
    if (permissions.isAuth) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, countryId, regionId]);

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
