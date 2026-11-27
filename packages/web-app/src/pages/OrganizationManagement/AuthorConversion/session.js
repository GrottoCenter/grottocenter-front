import { organizationConversionSessionKeys } from '@/api/queryKeys';
import { API_URL } from '@/conf/apiRoutes';
import { analyzeGlobalDocuments, cleanupError } from './api';

export const sessionSnapshotKey = accountId =>
  `organizationManagement.authorConversionSnapshot:${API_URL}:${accountId}`;

export const isValidSnapshot = snapshot =>
  snapshot?.version === 1 &&
  Number.isFinite(snapshot.analyzedAt) &&
  snapshot.analyzedAt > 0 &&
  ['deleted', 'pending'].every(
    key =>
      snapshot[key] &&
      typeof snapshot[key] === 'object' &&
      !Array.isArray(snapshot[key]) &&
      Object.entries(snapshot[key]).every(
        ([id, count]) =>
          /^\d+$/.test(id) && Number.isSafeInteger(count) && count > 0
      )
  );

const readSnapshot = accountId => {
  try {
    const snapshot = JSON.parse(
      sessionStorage.getItem(sessionSnapshotKey(accountId))
    );
    return isValidSnapshot(snapshot) ? snapshot : undefined;
  } catch {
    return undefined;
  }
};

const saveSnapshot = (accountId, snapshot) => {
  try {
    sessionStorage.setItem(
      sessionSnapshotKey(accountId),
      JSON.stringify(snapshot)
    );
  } catch {
    // Session storage is optional; the in-memory query still shares the result.
  }
};

export const clearStoredSnapshot = accountId => {
  try {
    sessionStorage.removeItem(sessionSnapshotKey(accountId));
  } catch {
    // A blocked storage backend must not prevent an explicit in-memory refresh.
  }
};

export const getSessionSnapshotOptions = (accountId, { onProgress } = {}) => ({
  queryKey: organizationConversionSessionKeys.snapshot(API_URL, accountId),
  // Keep the session-wide read alive when an observer unmounts. Consuming the
  // query's AbortSignal would restart it on navigation and StrictMode remounts.
  queryFn: async () => {
    if (!navigator.onLine) throw cleanupError('offline');
    const snapshot = await analyzeGlobalDocuments({ onProgress });
    saveSnapshot(accountId, snapshot);
    return snapshot;
  },
  initialData: () => readSnapshot(accountId),
  initialDataUpdatedAt: () => readSnapshot(accountId)?.analyzedAt,
  // Explicit refresh is the only way to replace this session's snapshot.
  staleTime: 'static',
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retryOnMount: false,
  retry: false,
  meta: { errorPresentation: 'inline' }
});

export const requireSessionSnapshot = (queryClient, accountId) => {
  const state = queryClient.getQueryState(
    organizationConversionSessionKeys.snapshot(API_URL, accountId)
  );
  if (
    state?.status !== 'success' ||
    state.fetchStatus !== 'idle' ||
    !isValidSnapshot(state.data)
  ) {
    throw cleanupError('sessionUnavailable');
  }
  return state.data;
};
