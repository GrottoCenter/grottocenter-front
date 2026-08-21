import { useParams } from 'react-router-dom';
import Entry from '../../components/appli/Entry';
import { useCave, useEntrance, usePermissions } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const EntryPage = () => {
  const { entranceId } = useParams();
  const permissions = usePermissions();
  const { data, isPending, isPaused, error, refetch } = useEntrance(entranceId);

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
      isLoading={isPending}
      error={error}
      isPaused={isPaused}
      onRetry={refetch}
      entrance={data}
      networkDescriptionsCount={networkDescriptionsCount}
    />
  );
};

export default EntryPage;
