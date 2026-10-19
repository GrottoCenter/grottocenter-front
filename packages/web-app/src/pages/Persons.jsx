import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PERSON_TYPE, isPersonType } from '@/utils/personTypes';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import PersonSearch from '../components/appli/AdvancedSearch/PersonSearch';

const PersonsSearchPage = () => {
  const [searchParams] = useSearchParams();
  const requestedType = searchParams.get('type');
  const initialType = isPersonType(requestedType)
    ? requestedType
    : DEFAULT_PERSON_TYPE;
  return (
    <EntitySearchPage
      key={initialType}
      title="Persons"
      entityType="persons"
      initialFilter={{ type: initialType }}>
      <PersonSearch initialType={initialType} />
    </EntitySearchPage>
  );
};

export default PersonsSearchPage;
