import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Person from '../../components/appli/Person/Person';
import { fetchPerson } from '../../actions/Person/GetPerson';
import { fetchSubscriptions } from '../../actions/Subscriptions/GetSubscriptions';
import REDUCER_STATUS from '../../reducers/ReducerStatus';

const PersonPage = () => {
  const { personId } = useParams();
  const dispatch = useDispatch();
  const { person, error, isFetching } = useSelector(state => state.person);
  const { subscriptions, status: subscriptionsStatus } = useSelector(
    state => state.subscriptions
  );

  useEffect(() => {
    dispatch(fetchPerson(personId));
    dispatch(fetchSubscriptions(personId));
  }, [personId, dispatch]);

  return (
    <Person
      isLoading={isFetching || subscriptionsStatus === REDUCER_STATUS.LOADING}
      person={person}
      error={error}
      subscriptions={subscriptions}
      subscriptionsStatus={subscriptionsStatus}
    />
  );
};
export default PersonPage;
