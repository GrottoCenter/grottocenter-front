import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_ORGANIZATION_TYPE,
  isOrganizationType
} from '@/utils/organizationTypes';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import OrganizationsSearch from '../components/appli/AdvancedSearch/OrganizationsSearch';
import NewEntityButton from '../components/common/NewEntityButton';
import { EntityIcon } from './EntityCreation/entityConfig';

const OrganizationsSearchPage = () => {
  const [searchParams] = useSearchParams();
  const requestedType = searchParams.get('type');
  let initialType = DEFAULT_ORGANIZATION_TYPE;
  if (requestedType === 'ALL') initialType = '';
  else if (isOrganizationType(requestedType)) initialType = requestedType;

  return (
    <EntitySearchPage
      key={initialType}
      title="Organizations"
      entityType="organizations"
      initialFilter={initialType ? { type: initialType } : {}}
      actions={
        <NewEntityButton
          to="/ui/entity/add/organization"
          icon={<EntityIcon iconType="organization" size={20} />}
        />
      }>
      <OrganizationsSearch initialType={initialType} />
    </EntitySearchPage>
  );
};

export default OrganizationsSearchPage;
