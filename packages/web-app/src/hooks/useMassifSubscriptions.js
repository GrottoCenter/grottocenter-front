import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import REDUCER_STATUS from '../reducers/ReducerStatus';
import { fetchSubscriptions } from '../actions/Subscriptions/GetSubscriptions';
import { useUserProperties } from './useUserProperties';
import { useReducerSuccessNotification } from './useReducerSuccessNotification';

const isSubscribed = (subscriptions, massifId) => {
  if (subscriptions && subscriptions.massifs) {
    return subscriptions.massifs.some(m => m.id === massifId);
  }
  return false;
};

export const useMassifSubscriptions = massifId => {
  const dispatch = useDispatch();
  const userProperties = useUserProperties();
  const { status: subscribeStatus } = useSelector(
    state => state.subscribeToMassif
  );
  const { status: unsubscribeStatus } = useSelector(
    state => state.unsubscribeFromMassif
  );
  const { subscriptions } = useSelector(state => state.subscriptions);

  // Refetch subscriptions when (un)suscribing is successful
  useEffect(() => {
    const subscribeSucceeded = subscribeStatus === REDUCER_STATUS.SUCCEEDED;
    const unSubscribeSucceeded = unsubscribeStatus === REDUCER_STATUS.SUCCEEDED;
    if (
      userProperties &&
      userProperties.id &&
      (subscribeSucceeded || unSubscribeSucceeded)
    ) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
  }, [dispatch, subscribeStatus, unsubscribeStatus, userProperties]);

  // Display a snackbar on success
  useReducerSuccessNotification(
    subscribeStatus,
    'You are subscribed to the massif.'
  );
  useReducerSuccessNotification(
    unsubscribeStatus,
    'You are unsubscribed from the massif.'
  );

  return {
    isSubscribed: isSubscribed(subscriptions, massifId),
    isLoading:
      subscribeStatus === REDUCER_STATUS.LOADING ||
      unsubscribeStatus === REDUCER_STATUS.LOADING
  };
};

useMassifSubscriptions.propTypes = {
  massifId: PropTypes.number.isRequired
};
