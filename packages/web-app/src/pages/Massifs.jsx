import React from 'react';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import MassifsSearch from '../components/appli/AdvancedSearch/MassifsSearch';

const MassifsSearchPage = () => (
  <EntitySearchPage title="Massifs" entityType="massifs">
    <MassifsSearch />
  </EntitySearchPage>
);

export default MassifsSearchPage;
