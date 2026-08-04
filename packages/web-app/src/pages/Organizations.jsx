import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import OrganizationsSearch from '../components/appli/AdvancedSearch/OrganizationsSearch';
import NewEntityButton from '../components/common/NewEntityButton';
import { EntityIcon } from './EntityCreation/entityConfig';

const OrganizationsSearchPage = () => (
  <EntitySearchPage
    title="Organizations"
    entityType="organizations"
    actions={
      <NewEntityButton
        to="/ui/entity/add/organization"
        icon={<EntityIcon iconType="organization" size={20} />}
      />
    }>
    <OrganizationsSearch />
  </EntitySearchPage>
);

export default OrganizationsSearchPage;
