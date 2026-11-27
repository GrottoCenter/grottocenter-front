import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clearStoredSnapshot, getSessionSnapshotOptions } from './session';

export const useCleanupSession = (accountId, { enabled = true } = {}) => {
  const [progress, setProgress] = useState(null);
  const query = useQuery({
    ...getSessionSnapshotOptions(accountId, { onProgress: setProgress }),
    enabled
  });
  const refresh = () => {
    // A failed refresh must not resurrect the previous snapshot after a reload.
    clearStoredSnapshot(accountId);
    return query.refetch({ cancelRefetch: false });
  };
  return {
    ...query,
    progress,
    refresh,
    isReady: query.isSuccess && !query.isFetching
  };
};
