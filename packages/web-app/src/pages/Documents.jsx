import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import DocumentSearch from '../components/appli/AdvancedSearch/DocumentSearch';
import NewEntityButton from '../components/common/NewEntityButton';
import { getDocumentReferenceFilter } from '../utils/documentReferenceSearch';
import { EntityIcon } from './EntityCreation/entityConfig';

const DocumentsSearchPage = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.toString();
  const initialFilter = useMemo(
    () => getDocumentReferenceFilter(new URLSearchParams(search)),
    [search]
  );
  const lockedFilter = useMemo(
    () => Object.keys(initialFilter),
    [initialFilter]
  );

  return (
    <EntitySearchPage
      key={search || 'all-documents'}
      title="Documents"
      entityType="documents"
      initialFilter={initialFilter}
      actions={
        <NewEntityButton
          to="/ui/entity/add/document"
          icon={<EntityIcon iconType="bibliography" size={20} />}
        />
      }>
      <DocumentSearch
        initialFilter={initialFilter}
        lockedFilter={lockedFilter}
      />
    </EntitySearchPage>
  );
};

export default DocumentsSearchPage;
