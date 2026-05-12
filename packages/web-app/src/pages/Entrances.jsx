import React from 'react';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import EntrancesSearch from '../components/appli/AdvancedSearch/EntrancesSearch';
import NewEntityButton from '../components/common/NewEntityButton';

const EntrancesSearchPage = () => (
  <EntitySearchPage
    title="Entrances"
    entityType="entrances"
    actions={<NewEntityButton to="/ui/entity/add/entrance" />}>
    <EntrancesSearch />
  </EntitySearchPage>
);

export default EntrancesSearchPage;
