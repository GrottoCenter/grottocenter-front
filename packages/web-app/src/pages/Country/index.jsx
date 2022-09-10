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
  const { country, error, isLoading } = useSelector(state => state.country);
  const onSubscribe = () => dispatch(subscribeToCountry(countryId));
  const onUnsubscribe = () => dispatch(unsubscribeFromCountry(countryId));
  const canSubscribe = permissions.isLeader;

  useEffect(() => {
    dispatch(fetchCountry(countryId));
    if (userProperties) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
  }, [dispatch, countryId, userProperties]);

  return (
    <Country
      canSubscribe={canSubscribe}
      country={country}
      error={error}
      isLoading={isLoading}
      onSubscribe={onSubscribe}
      onUnsubscribe={onUnsubscribe}
    />
  );
};
export default CountryPage;
