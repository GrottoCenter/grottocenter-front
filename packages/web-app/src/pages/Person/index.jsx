import { useParams } from 'react-router-dom';
import Person from '../../components/appli/Person/Person';
import { usePerson } from '../../hooks';

const PersonPage = () => {
  const { personId } = useParams();
  const {
    data: person,
    error,
    isPending,
    isPaused,
    refetch
  } = usePerson(personId);

  return (
    <Person
      key={personId}
      isLoading={isPending}
      person={person}
      error={error}
      isPaused={isPaused}
      onRetry={refetch}
    />
  );
};
export default PersonPage;
