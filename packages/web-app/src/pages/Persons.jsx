import React from 'react';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import PersonSearch from '../components/appli/AdvancedSearch/PersonSearch';

const PersonsSearchPage = () => (
  <EntitySearchPage title="Persons" entityType="persons">
    <PersonSearch />
  </EntitySearchPage>
);

export default PersonsSearchPage;
