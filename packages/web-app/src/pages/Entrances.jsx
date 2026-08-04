import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import EntrancesSearch from '../components/appli/AdvancedSearch/EntrancesSearch';
import NewEntityButton from '../components/common/NewEntityButton';
import { EntityIcon } from './EntityCreation/entityConfig';

const EntrancesSearchPage = () => (
  <EntitySearchPage
    title="Entrances"
    entityType="entrances"
    actions={
      <NewEntityButton
        to="/ui/entity/add/entrance"
        icon={<EntityIcon iconType="entrance" size={20} />}
      />
    }>
    <EntrancesSearch />
  </EntitySearchPage>
);

export default EntrancesSearchPage;
