import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Massif from '../../components/appli/Massif/Massif';
import { loadMassif } from '../../actions/Massif/GetMassif';
import { fetchSubscriptions } from '../../actions/Subscriptions/GetSubscriptions';
import { usePermissions, useUserProperties } from '../../hooks';
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

  // Initial data fetch
  useEffect(() => {
    dispatch(loadMassif(massifId));
    if (userProperties) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
  }, [massifId, userProperties, dispatch]);

  return massif?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.massif} entity={massif} />
  ) : (
    <Massif isLoading={isFetching} error={error} massif={massif} />
  );
};
export default MassifPage;
