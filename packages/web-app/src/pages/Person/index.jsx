import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Person from '../../components/appli/Person/Person';
import { fetchPerson } from '../../actions/Person/GetPerson';

const PersonPage = () => {
  const { personId } = useParams();
  const dispatch = useDispatch();
  const { person, error, isFetching } = useSelector(state => state.person);

  useEffect(() => {
    dispatch(fetchPerson(personId));
  }, [personId, dispatch]);

  return (
    <Person
      key={personId}
      isLoading={isFetching}
      person={person}
      error={error}
    />
  );
};
export default PersonPage;
