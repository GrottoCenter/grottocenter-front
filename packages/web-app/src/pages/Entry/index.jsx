import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Entry from '../../components/appli/Entry';
import { fetchEntrance } from '../../actions/Entrance/GetEntrance';
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

  useEffect(() => {
    dispatch(fetchEntrance(entranceId));
  }, [entranceId, dispatch]);

  return data?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.entrance} entity={data} />
  ) : (
    <Entry isLoading={loading} error={error} entrance={data} />
  );
};

export default EntryPage;
