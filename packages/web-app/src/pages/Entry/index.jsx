import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Entry from '../../components/appli/Entry';
import { fetchEntrance } from '../../actions/Entrance/GetEntrance';
import { fetchCave } from '../../actions/Cave/GetCave';
import { usePermissions } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const EntryPage = () => {
  const dispatch = useDispatch();
  const { entranceId } = useParams();
  const permissions = usePermissions();
  const { loading, data, error } = useSelector(state => state.entrance);
  const { cave: networkCave } = useSelector(state => state.cave);

  useEffect(() => {
    dispatch(fetchEntrance(entranceId));
  }, [entranceId, dispatch]);

  const networkCaveId = data?.cave?.entrances?.length > 1 ? data?.cave?.id : undefined;

  useEffect(() => {
    if (networkCaveId) dispatch(fetchCave(networkCaveId));
  }, [networkCaveId, dispatch]);

  const networkDescriptionsCount =
    networkCave?.id === networkCaveId ? (networkCave?.descriptions?.length ?? 0) : 0;

  return data?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.entrance} entity={data} />
  ) : (
    <Entry
      isLoading={loading}
      error={error}
      entrance={data}
      networkDescriptionsCount={networkDescriptionsCount}
    />
  );
};

export default EntryPage;
