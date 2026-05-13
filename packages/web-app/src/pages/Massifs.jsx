import React from 'react';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import MassifsSearch from '../components/appli/AdvancedSearch/MassifsSearch';
import NewEntityButton from '../components/common/NewEntityButton';

const MassifsSearchPage = () => (
  <EntitySearchPage
    title="Massifs"
    entityType="massifs"
    actions={<NewEntityButton to="/ui/entity/add/massif" />}>
    <MassifsSearch />
  </EntitySearchPage>
);

export default MassifsSearchPage;
