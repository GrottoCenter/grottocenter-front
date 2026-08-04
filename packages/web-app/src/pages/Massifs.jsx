import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import MassifsSearch from '../components/appli/AdvancedSearch/MassifsSearch';
import NewEntityButton from '../components/common/NewEntityButton';
import { EntityIcon } from './EntityCreation/entityConfig';

const MassifsSearchPage = () => (
  <EntitySearchPage
    title="Massifs"
    entityType="massifs"
    actions={
      <NewEntityButton
        to="/ui/entity/add/massif"
        icon={<EntityIcon iconType="massif" size={20} />}
      />
    }>
    <MassifsSearch />
  </EntitySearchPage>
);

export default MassifsSearchPage;
