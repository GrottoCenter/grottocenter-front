import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postGuidelineUrl,
  patchGuidelineUrl,
  deleteGuidelineUrl,
  restoreGuidelineUrl,
  rollbackGuidelineUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPatch, apiDelete } from '../../api/client';
import {
  countryKeys,
  guidelineKeys,
  massifKeys,
  regionKeys
} from '../../api/queryKeys';

// A guideline is many-to-many with country / region / massif. The API
// response doesn't tell us which specific parents to invalidate cheaply, so
// we invalidate the three domain roots. RQ only refetches queries currently
// mounted — at most one detail per open page, and usually zero.
const invalidateGuidelineHosts = queryClient => {
  queryClient.invalidateQueries({ queryKey: guidelineKeys.all });
  queryClient.invalidateQueries({ queryKey: countryKeys.all });
  queryClient.invalidateQueries({ queryKey: regionKeys.all });
  queryClient.invalidateQueries({ queryKey: massifKeys.all });
};

const useGuidelineMutation = mutationFn => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => invalidateGuidelineHosts(queryClient)
  });
};

export const usePostGuideline = () =>
  useGuidelineMutation(
    ({ countries, regions, massifs, title, description, language }) =>
      apiPost(postGuidelineUrl, {
        countries,
        regions,
        massifs,
        title,
        description,
        language
      })
  );

export const usePatchGuideline = () =>
  useGuidelineMutation(({ id, ...body }) =>
    apiPatch(patchGuidelineUrl(id), body)
  );

export const useDeleteGuideline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPermanent }) =>
      apiDelete(deleteGuidelineUrl(id, isPermanent)),
    onSuccess: () => invalidateGuidelineHosts(queryClient)
  });
};

export const useRestoreGuideline = () =>
  useGuidelineMutation(({ id }) => apiPost(restoreGuidelineUrl(id)));

export const useRollbackGuideline = () =>
  useGuidelineMutation(({ id, snapshotId }) =>
    apiPost(rollbackGuidelineUrl(id, snapshotId))
  );
