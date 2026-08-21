import { useParams } from 'react-router-dom';
import Network from '../../components/appli/Network';
import { useCave, usePermissions } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const NetworkPage = () => {
  const { caveId } = useParams();
  const permissions = usePermissions();
  const { data: cave, isPending, isPaused, error, refetch } = useCave(caveId);

  return cave?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.network} entity={cave} />
  ) : (
    <Network
      key={caveId}
      isLoading={isPending}
      error={error}
      isPaused={isPaused}
      onRetry={refetch}
      cave={cave}
    />
  );
};

export default NetworkPage;
