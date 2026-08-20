import { useParams } from 'react-router-dom';
import Massif from '../../components/appli/Massif/Massif';
import { useMassif, usePermissions } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const MassifPage = () => {
  const { massifId } = useParams();
  const permissions = usePermissions();

  const {
    data: massif,
    isPending,
    isPaused,
    error,
    refetch
  } = useMassif(massifId);

  return massif?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.massif} entity={massif} />
  ) : (
    <Massif
      key={massifId}
      isLoading={isPending}
      error={error}
      isPaused={isPaused}
      onRetry={refetch}
      massif={massif}
    />
  );
};
export default MassifPage;
