import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Massif from '../../components/appli/Massif/Massif';
import { loadMassif } from '../../actions/Massif/GetMassif';
import { fetchSubscriptions } from '../../actions/Subscriptions/GetSubscriptions';
import {
  usePermissions,
  useRefetchOnReconnect,
  useUserProperties
} from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const MassifPage = () => {
  const dispatch = useDispatch();
  const { massifId } = useParams();
  const permissions = usePermissions();
  const userProperties = useUserProperties();

  const { massif, isFetching, error } = useSelector(state => state.massif);

  const reloadMassif = useCallback(
    () => dispatch(loadMassif(massifId)),
    [dispatch, massifId]
  );

  // Initial data fetch
  useEffect(() => {
    dispatch(loadMassif(massifId));
    if (permissions.isAuth) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [massifId, dispatch]);

  useRefetchOnReconnect(reloadMassif, Boolean(error));

  return massif?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.massif} entity={massif} />
  ) : (
    <Massif
      key={massifId}
      isLoading={isFetching}
      error={error}
      onRetry={reloadMassif}
      massif={massif}
    />
  );
};
export default MassifPage;
