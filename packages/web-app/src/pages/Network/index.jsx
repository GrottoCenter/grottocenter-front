import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Network from '../../components/appli/Network';
import { fetchCave } from '../../actions/Cave/GetCave';
import { usePermissions, useRefetchOnReconnect } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const NetworkPage = () => {
  const dispatch = useDispatch();
  const { caveId } = useParams();
  const permissions = usePermissions();
  const { loading, cave, error } = useSelector(state => state.cave);

  const reloadCave = useCallback(
    () => dispatch(fetchCave(caveId)),
    [dispatch, caveId]
  );

  useEffect(() => {
    reloadCave();
  }, [reloadCave]);

  useRefetchOnReconnect(reloadCave, Boolean(error));

  return cave?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.network} entity={cave} />
  ) : (
    <Network
      key={caveId}
      isLoading={loading}
      error={error}
      onRetry={reloadCave}
      cave={cave}
    />
  );
};

export default NetworkPage;
