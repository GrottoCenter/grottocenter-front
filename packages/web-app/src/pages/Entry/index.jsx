import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Entry from '../../components/appli/Entry';
import { fetchEntrance } from '../../actions/Entrance/GetEntrance';
import {
  fetchNetworkCaveDescriptionsCount,
  resetNetworkCaveDescriptionsCount
} from '../../actions/Cave/GetNetworkCaveDescriptionsCount';
import { usePermissions, useRefetchOnReconnect } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const EntryPage = () => {
  const dispatch = useDispatch();
  const { entranceId } = useParams();
  const permissions = usePermissions();
  const { loading, data, error } = useSelector(state => state.entrance);
  const networkDescriptionsCount = useSelector(
    state => state.cave.networkDescriptionsCount
  );

  const reloadEntrance = useCallback(
    () => dispatch(fetchEntrance(entranceId)),
    [dispatch, entranceId]
  );

  useEffect(() => {
    reloadEntrance();
    dispatch(resetNetworkCaveDescriptionsCount());
  }, [reloadEntrance, dispatch]);

  // Repair the page on its own when the connection returns, so a caver who
  // lost signal mid-read finds the content rather than an error.
  useRefetchOnReconnect(reloadEntrance, Boolean(error));

  const networkCaveId =
    data?.cave?.entrances?.length > 1 ? data?.cave?.id : undefined;

  useEffect(() => {
    if (networkCaveId)
      dispatch(fetchNetworkCaveDescriptionsCount(networkCaveId));
  }, [networkCaveId, dispatch]);

  return data?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.entrance} entity={data} />
  ) : (
    <Entry
      isLoading={loading}
      error={error}
      onRetry={reloadEntrance}
      entrance={data}
      networkDescriptionsCount={networkDescriptionsCount}
    />
  );
};

export default EntryPage;
