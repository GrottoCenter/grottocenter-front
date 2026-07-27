import React from 'react';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import PersonSearch from '../components/appli/AdvancedSearch/PersonSearch';

const PersonsSearchPage = () => (
  <EntitySearchPage
    title="Cavers"
    entityType="persons"
    initialFilter={{ type: 'CAVER' }}>
    <PersonSearch />
  </EntitySearchPage>
);

export default PersonsSearchPage;
