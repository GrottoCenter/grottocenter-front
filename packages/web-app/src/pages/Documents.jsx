import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import DocumentSearch from '../components/appli/AdvancedSearch/DocumentSearch';
import NewEntityButton from '../components/common/NewEntityButton';
import { EntityIcon } from './EntityCreation/entityConfig';

const DocumentsSearchPage = () => (
  <EntitySearchPage
    title="Documents"
    entityType="documents"
    actions={
      <NewEntityButton
        to="/ui/entity/add/document"
        icon={<EntityIcon iconType="bibliography" size={20} />}
      />
    }>
    <DocumentSearch />
  </EntitySearchPage>
);

export default DocumentsSearchPage;
