import React from 'react';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import EntrancesSearch from '../components/appli/AdvancedSearch/EntrancesSearch';

const EntrancesSearchPage = () => (
  <EntitySearchPage title="Entrances" entityType="entrances">
    <EntrancesSearch />
  </EntitySearchPage>
);

export default EntrancesSearchPage;
