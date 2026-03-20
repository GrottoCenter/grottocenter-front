import React from 'react';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import DocumentSearch from '../components/appli/AdvancedSearch/DocumentSearch';

const DocumentsSearchPage = () => (
  <EntitySearchPage title="Documents" entityType="documents">
    <DocumentSearch />
  </EntitySearchPage>
);

export default DocumentsSearchPage;
