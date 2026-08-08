import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Person from '../../components/appli/Person/Person';
import { fetchPerson } from '../../actions/Person/GetPerson';
import { useRefetchOnReconnect } from '../../hooks';

const PersonPage = () => {
  const { personId } = useParams();
  const dispatch = useDispatch();
  const { person, error, isFetching } = useSelector(state => state.person);

  const reloadPerson = useCallback(
    () => dispatch(fetchPerson(personId)),
    [dispatch, personId]
  );

  useEffect(() => {
    reloadPerson();
  }, [reloadPerson]);

  useRefetchOnReconnect(reloadPerson, Boolean(error));

  return (
    <Person
      key={personId}
      isLoading={isFetching}
      person={person}
      error={error}
      onRetry={reloadPerson}
    />
  );
};
export default PersonPage;
