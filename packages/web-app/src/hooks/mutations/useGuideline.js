import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';

import {
  postGuidelineUrl,
  patchGuidelineUrl,
  deleteGuidelineUrl,
  restoreGuidelineUrl,
  rollbackGuidelineUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPatch, apiDelete } from '../../api/client';
import { countryKeys, massifKeys } from '../../api/queryKeys';

// A guideline is many-to-many with country / region / massif. Country and
// massif details now live in React Query; RegionDetailsReducer still listens
// to the *_GUIDELINE_* actions to keep state.regionDetails.guidelines in
// sync until B4. The dispatch drops out completely once Region is RQ.

const invalidateGuidelineHosts = queryClient => {
  queryClient.invalidateQueries({ queryKey: countryKeys.all });
  queryClient.invalidateQueries({ queryKey: massifKeys.all });
};

const useGuidelineMutation = ({ mutationFn, dispatchType }) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn,
    onSuccess: data => {
      invalidateGuidelineHosts(queryClient);
      dispatch({ type: dispatchType, guideline: data });
    }
  });
};

export const usePostGuideline = () =>
  useGuidelineMutation({
    mutationFn: ({
      countries,
      regions,
      massifs,
      title,
      description,
      language
    }) =>
      apiPost(postGuidelineUrl, {
        countries,
        regions,
        massifs,
        title,
        description,
        language
      }),
    dispatchType: 'POST_GUIDELINE_SUCCESS'
  });

export const usePatchGuideline = () =>
  useGuidelineMutation({
    mutationFn: ({ id, ...body }) => apiPatch(patchGuidelineUrl(id), body),
    dispatchType: 'PATCH_GUIDELINE_SUCCESS'
  });

// Delete carries a small quirk: the API can respond 204 (no body) and the
// caller expects `.id` to fall through so the reducers can drop the row.
export const useDeleteGuideline = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: async ({ id, isPermanent }) => {
      const data = await apiDelete(deleteGuidelineUrl(id, isPermanent));
      return { ...(data || {}), id };
    },
    onSuccess: (data, { isPermanent }) => {
      invalidateGuidelineHosts(queryClient);
      dispatch({
        type: isPermanent
          ? 'DELETE_GUIDELINE_PERMANENT_SUCCESS'
          : 'DELETE_GUIDELINE_SUCCESS',
        guideline: data
      });
    }
  });
};

export const useRestoreGuideline = () =>
  useGuidelineMutation({
    mutationFn: ({ id }) => apiPost(restoreGuidelineUrl(id)),
    dispatchType: 'RESTORE_GUIDELINE_SUCCESS'
  });

export const useRollbackGuideline = () =>
  useGuidelineMutation({
    mutationFn: ({ id, snapshotId }) =>
      apiPost(rollbackGuidelineUrl(id, snapshotId)),
    dispatchType: 'ROLLBACK_GUIDELINE_SUCCESS'
  });
