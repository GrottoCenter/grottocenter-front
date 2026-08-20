import { useRecentChanges } from '../hooks';
import RecentChangesCard from '../components/common/card/RecentChangesCard';

const noop = () => {};

const RecentChangesContainer = () => {
  const { data: changes, isPending } = useRecentChanges();
  return (
    <RecentChangesCard changes={changes} isFetching={isPending} fetch={noop} />
  );
};

export default RecentChangesContainer;
