import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getDuplicateDocumentUrl,
  getDuplicateEntranceUrl,
  getDuplicatesDocumentUrl,
  getDuplicatesEntranceUrl,
  deleteDuplicateDocumentUrl,
  deleteDuplicateEntranceUrl,
  deleteDuplicatesDocumentUrl,
  deleteDuplicatesEntranceUrl,
  createNewDocumentFromDuplicateUrl,
  createNewEntranceFromDuplicateUrl
} from '../../conf/apiRoutes';
import { apiDelete, apiGetWithRange, apiPost } from '../../api/client';
import { duplicateKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';
import { getTotalCount, makeUrl } from '../../actions/utils';

const listUrlByType = {
  entrance: getDuplicatesEntranceUrl,
  document: getDuplicatesDocumentUrl
};
const detailUrlByType = {
  entrance: getDuplicateEntranceUrl,
  document: getDuplicateDocumentUrl
};
const deleteOneUrlByType = {
  entrance: deleteDuplicateEntranceUrl,
  document: deleteDuplicateDocumentUrl
};
const deleteManyUrlByType = {
  entrance: deleteDuplicatesEntranceUrl,
  document: deleteDuplicatesDocumentUrl
};
const createNewFromUrlByType = {
  entrance: createNewEntranceFromDuplicateUrl,
  document: createNewDocumentFromDuplicateUrl
};

// Paginated moderator queue of pending duplicate rows, per entity type. The
// list returns Content-Range so total counts drive the pagination UI.
const selectList = ({ data, contentRange }) => ({
  duplicatesList: data?.duplicates ?? [],
  totalCount: getTotalCount(data?.duplicates?.length ?? 0, contentRange)
});

export const useDuplicatesList = (type, criteria) => {
  const url = listUrlByType[type];
  return useQuery({
    queryKey: duplicateKeys.list(type, criteria ?? null),
    queryFn: () => apiGetWithRange(criteria ? makeUrl(url, criteria) : url),
    enabled: !!url,
    select: selectList,
    staleTime: STALE.VOLATILE
  });
};

// Single duplicate detail — pair of {entrance|document, content} shown in
// the DuplicatesHandler side-by-side compare view.
export const useDuplicate = (type, id) => {
  const url = detailUrlByType[type];
  return useQuery({
    queryKey: duplicateKeys.detail(type, id),
    queryFn: () => apiGetWithRange(url(id)).then(r => r.data),
    enabled: !!url && !!id,
    staleTime: STALE.VOLATILE
  });
};

// Delete a batch of duplicates by id list. Invalidates the whole domain so
// both list and any detail refetch cleanly.
export const useDeleteDuplicates = type => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ids => {
      const base = deleteManyUrlByType[type];
      const query = ids.map(id => `id=${encodeURIComponent(id)}`).join('&');
      return apiDelete(`${base}?${query}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: duplicateKeys.all })
  });
};

// Delete one duplicate row. Same invalidation scope — the caller relies on
// it firing so the queue refreshes after each merge step.
export const useDeleteDuplicate = type => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: id => apiDelete(deleteOneUrlByType[type](id)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: duplicateKeys.all })
  });
};

// "Not a duplicate" path: create a fresh entity from the imported content.
// Invalidates duplicates so the source row disappears from the queue.
export const useCreateEntityFromDuplicate = type => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: id => apiPost(createNewFromUrlByType[type](id), undefined),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: duplicateKeys.all })
  });
};
