import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Massif from '../../components/appli/Massif/Massif';
import { fetchSubscriptions } from '../../actions/Subscriptions/GetSubscriptions';
import { useMassif, usePermissions, useUserProperties } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const MassifPage = () => {
  const dispatch = useDispatch();
  const { massifId } = useParams();
  const permissions = usePermissions();
  const userProperties = useUserProperties();

  const {
    data: massif,
    isPending,
    isPaused,
    error,
    refetch
  } = useMassif(massifId);

  useEffect(() => {
    if (permissions.isAuth) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [massifId, dispatch]);

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
