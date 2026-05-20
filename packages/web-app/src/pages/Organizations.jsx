import React from 'react';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import OrganizationsSearch from '../components/appli/AdvancedSearch/OrganizationsSearch';
import NewEntityButton from '../components/common/NewEntityButton';

const OrganizationsSearchPage = () => (
  <EntitySearchPage
    title="Organizations"
    entityType="organizations"
    actions={<NewEntityButton to="/ui/entity/add/organization" />}>
    <OrganizationsSearch />
  </EntitySearchPage>
);

export default OrganizationsSearchPage;
