import { pick } from 'ramda';

import {
  advancedSearchKeys,
  caveKeys,
  countryKeys,
  documentKeys,
  entranceKeys,
  guidelineKeys,
  massifKeys,
  organizationKeys,
  personKeys,
  quicksearchKeys,
  regionKeys,
  snapshotKeys,
  statsKeys
} from '@/api/queryKeys';

const relatedEntityKeys = [
  caveKeys.all,
  countryKeys.all,
  documentKeys.all,
  entranceKeys.all,
  guidelineKeys.all,
  massifKeys.all,
  organizationKeys.all,
  personKeys.all,
  regionKeys.all,
  advancedSearchKeys.all,
  quicksearchKeys.all,
  snapshotKeys.all,
  statsKeys.all
];

const updateDeletedState = (
  queryClient,
  sourceKey,
  data,
  id,
  isDeleted,
  redirectTo
) => {
  const imageKey = entranceKeys.featuredImage(id);
  queryClient.getQueriesData({ queryKey: sourceKey }).forEach(([queryKey]) => {
    const isPartial =
      queryKey.length === imageKey.length &&
      queryKey.every((part, index) => part === imageKey[index]);
    queryClient.setQueryData(queryKey, current => {
      if (!current || typeof current !== 'object' || Array.isArray(current))
        return current;
      const updatedData =
        data?.isDeleted === isDeleted && String(data.id) === String(id)
          ? data
          : {};
      // Only popup entries filter response fields; full details keep new fields.
      return {
        ...current,
        ...(isPartial ? pick(Object.keys(current), updatedData) : updatedData),
        isDeleted,
        redirectTo
      };
    });
  });
};

const invalidateRelated = (queryClient, sourceKey, relatedKeys) => {
  relatedKeys.forEach(queryKey => {
    queryClient.invalidateQueries({
      queryKey,
      predicate: query =>
        !sourceKey.every((part, index) => query.queryKey[index] === part)
    });
  });
};

const removeAfterUnmount = (queryClient, sourceKey) => {
  const cache = queryClient.getQueryCache();
  const mountedSources = new Set(cache.findAll({ queryKey: sourceKey }));
  if (!mountedSources.size) return;
  const unsubscribe = cache.subscribe(event => {
    if (!mountedSources.has(event.query)) return;
    if (event.type === 'removed') mountedSources.delete(event.query);
    if (event.type === 'observerRemoved' && !event.query.getObserversCount()) {
      mountedSources.delete(event.query);
      cache.remove(event.query);
    }
    if (!mountedSources.size) unsubscribe();
  });
};

// Keep the mounted source stable until its success handler closes or navigates.
export const completeEntityDeletion = async (
  queryClient,
  entityKeys,
  data,
  { id, entityId, isPermanent },
  relatedKeys = relatedEntityKeys
) => {
  const sourceKey = entityKeys.detail(id);
  await queryClient.cancelQueries({ queryKey: sourceKey });
  if (isPermanent) {
    queryClient.removeQueries({ queryKey: sourceKey, type: 'inactive' });
    removeAfterUnmount(queryClient, sourceKey);
  } else {
    updateDeletedState(
      queryClient,
      sourceKey,
      data,
      id,
      true,
      entityId ?? null
    );
  }
  queryClient.invalidateQueries({
    queryKey: sourceKey,
    refetchType: 'none'
  });
  invalidateRelated(queryClient, sourceKey, relatedKeys);
};

export const completeEntityRestoration = async (
  queryClient,
  entityKeys,
  data,
  { id },
  relatedKeys = relatedEntityKeys
) => {
  const sourceKey = entityKeys.detail(id);
  await queryClient.cancelQueries({ queryKey: sourceKey });
  updateDeletedState(queryClient, sourceKey, data, id, false, null);
  queryClient.invalidateQueries({ queryKey: sourceKey });
  invalidateRelated(queryClient, sourceKey, relatedKeys);
};
