import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Entry from '../../components/appli/Entry';
import { fetchEntrance } from '../../actions/Entrance/GetEntrance';
import { useCave, usePermissions, useRefetchOnReconnect } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const EntryPage = () => {
  const dispatch = useDispatch();
  const { entranceId } = useParams();
  const permissions = usePermissions();
  const { loading, data, error } = useSelector(state => state.entrance);

  const reloadEntrance = useCallback(
    () => dispatch(fetchEntrance(entranceId)),
    [dispatch, entranceId]
  );

  useEffect(() => {
    reloadEntrance();
  }, [reloadEntrance]);

  // Repair the page on its own when the connection returns, so a caver who
  // lost signal mid-read finds the content rather than an error.
  useRefetchOnReconnect(reloadEntrance, Boolean(error));

  // When the entrance belongs to a network cave with siblings, we display the
  // count of descriptions attached to the parent cave — helps the reader know
  // there's context beyond this one entrance. Query is disabled otherwise and
  // dedupes with any other useCave(id) mounted on the same page.
  const networkCaveId =
    data?.cave?.entrances?.length > 1 ? data?.cave?.id : undefined;
  const { data: networkCave } = useCave(networkCaveId);
  const networkDescriptionsCount = networkCave?.descriptions?.length ?? 0;

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
