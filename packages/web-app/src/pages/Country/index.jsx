import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchCountry } from '../../actions/Country/GetCountry';
import Country from '../../components/appli/Country';
import { usePermissions, useUserProperties } from '../../hooks';
import { fetchSubscriptions } from '../../actions/Subscriptions/GetSubscriptions';
import { subscribeToCountry } from '../../actions/Subscriptions/SubscribeToCountry';
import { unsubscribeFromCountry } from '../../actions/Subscriptions/UnsubscribeFromCountry';

const CountryPage = () => {
  const { id: countryId } = useParams();
  const dispatch = useDispatch();
  const userProperties = useUserProperties();
  const permissions = usePermissions();
  const { country, error, status } = useSelector(state => state.country);
  const onSubscribe = () => dispatch(subscribeToCountry(countryId));
  const onUnsubscribe = () => dispatch(unsubscribeFromCountry(countryId));
  const canSubscribe = permissions.isLeader;

  useEffect(() => {
    dispatch(fetchCountry(countryId));
    if (permissions.isAuth) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, countryId]);

  return (
    <Country
      canSubscribe={canSubscribe}
      country={country}
      error={error}
      onSubscribe={onSubscribe}
      onUnsubscribe={onUnsubscribe}
      status={status}
    />
  );
};
export default CountryPage;
