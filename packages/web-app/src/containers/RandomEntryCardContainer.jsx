import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRandomEntrance } from '../hooks';
import { listKeys } from '../api/queryKeys';
import RandomEntryCard from '../components/common/card/RandomEntryCard';

// The card renders its own useEffect(fetch) on mount — pass a no-op so the
// legacy prop contract holds; RQ has already fetched by the time the card
// mounts. onRefresh (bound below) forces a new random pick.
const noop = () => {};

const RandomEntryCardContainer = () => {
  const queryClient = useQueryClient();
  const { data: entry, isPending } = useRandomEntrance();
  const onRefresh = useCallback(
    () =>
      queryClient.invalidateQueries({ queryKey: listKeys.randomEntrance() }),
    [queryClient]
  );
  return (
    <RandomEntryCard
      entry={entry}
      isFetching={isPending}
      fetch={noop}
      onRefresh={onRefresh}
    />
  );
};

export default RandomEntryCardContainer;
