import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import REDUCER_STATUS from '../reducers/ReducerStatus';
import { fetchSubscriptions } from '../actions/Subscriptions/GetSubscriptions';
import { useUserProperties } from './useUserProperties';
import { useReducerSuccessNotification } from './useReducerSuccessNotification';

const subscribeSucceeded = reducerStatus =>
  reducerStatus === REDUCER_STATUS.SUCCEEDED;

export const useSubscriptions = () => {
  const dispatch = useDispatch();
  const userProperties = useUserProperties();
  const { status: massifSubscribeStatus } = useSelector(
    state => state.subscribeToMassif
  );
  const { status: massifUnsubscribeStatus } = useSelector(
    state => state.unsubscribeFromMassif
  );
  const { status: countrySubscribeStatus } = useSelector(
    state => state.subscribeToCountry
  );
  const { status: countryUnsubscribeStatus } = useSelector(
    state => state.unsubscribeFromCountry
  );
  const { subscriptions } = useSelector(state => state.subscriptions);

  const isSubscribed = useCallback(
    id => {
      let isSubscribedToCountry = false;
      let isSubscribedToMassif = false;
      if (subscriptions && subscriptions.countries) {
        isSubscribedToCountry = subscriptions.countries.some(c => c.id === id);
      }
      if (subscriptions && subscriptions.massifs) {
        isSubscribedToMassif = subscriptions.massifs.some(m => m.id === id);
      }
      return isSubscribedToCountry || isSubscribedToMassif;
    },
    [subscriptions]
  );

  // Refetch subscriptions when (un)suscribing is successful
  useEffect(() => {
    if (
      userProperties &&
      userProperties.id &&
      (subscribeSucceeded(massifSubscribeStatus) ||
        subscribeSucceeded(massifUnsubscribeStatus) ||
        subscribeSucceeded(countrySubscribeStatus) ||
        subscribeSucceeded(countryUnsubscribeStatus))
    ) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
  }, [
    countrySubscribeStatus,
    countryUnsubscribeStatus,
    dispatch,
    massifSubscribeStatus,
    massifUnsubscribeStatus,
    userProperties
  ]);

  // Display a snackbar on success
  useReducerSuccessNotification(
    massifSubscribeStatus,
    'You are subscribed to the massif.'
  );
  useReducerSuccessNotification(
    massifUnsubscribeStatus,
    'You are unsubscribed from the massif.'
  );
  useReducerSuccessNotification(
    countrySubscribeStatus,
    'You are subscribed to the country.'
  );
  useReducerSuccessNotification(
    countryUnsubscribeStatus,
    'You are unsubscribed from the country.'
  );

  return {
    subscriptions,
    isSubscribed,
    isCountryLoading:
      countrySubscribeStatus === REDUCER_STATUS.LOADING ||
      countryUnsubscribeStatus === REDUCER_STATUS.LOADING,
    isMassifLoading:
      massifSubscribeStatus === REDUCER_STATUS.LOADING ||
      massifUnsubscribeStatus === REDUCER_STATUS.LOADING
  };
};
