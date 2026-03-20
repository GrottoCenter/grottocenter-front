import React from 'react';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import OrganizationsSearch from '../components/appli/AdvancedSearch/OrganizationsSearch';

const OrganizationsSearchPage = () => (
  <EntitySearchPage title="Organizations" entityType="organizations">
    <OrganizationsSearch />
  </EntitySearchPage>
);

export default OrganizationsSearchPage;
