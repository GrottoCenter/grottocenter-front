import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchRegion } from '../../actions/Region/GetRegion';
import Region from '../../components/appli/Region';
import {
  usePermissions,
  useRefetchOnReconnect,
  useUserProperties
} from '../../hooks';
import { fetchSubscriptions } from '../../actions/Subscriptions/GetSubscriptions';
import { subscribeToRegion } from '../../actions/Subscriptions/SubscribeToRegion';
import { unsubscribeFromRegion } from '../../actions/Subscriptions/UnsubscribeFromRegion';

const RegionPage = () => {
  const { countryId, regionId } = useParams();
  const dispatch = useDispatch();
  const userProperties = useUserProperties();
  const permissions = usePermissions();
  const { region, error, status } = useSelector(state => state.regionDetails);
  const { country } = useSelector(state => state.country);
  const onSubscribe = () => dispatch(subscribeToRegion(countryId, regionId));
  const onUnsubscribe = () =>
    dispatch(unsubscribeFromRegion(countryId, regionId));
  const canSubscribe = permissions.isLeader;

  const reloadRegion = useCallback(
    () => dispatch(fetchRegion(countryId, regionId)),
    [dispatch, countryId, regionId]
  );

  useEffect(() => {
    dispatch(fetchRegion(countryId, regionId));
    if (permissions.isAuth) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, countryId, regionId]);

  useRefetchOnReconnect(reloadRegion, Boolean(error));

  return (
    <Region
      key={`${countryId}-${regionId}`}
      canSubscribe={canSubscribe}
      region={region}
      error={error}
      onRetry={reloadRegion}
      onSubscribe={onSubscribe}
      onUnsubscribe={onUnsubscribe}
      status={status}
      countryId={countryId}
      regionId={regionId}
      country={country}
    />
  );
};

export default RegionPage;
