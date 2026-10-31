import {
  postRiggingsUrl,
  putRiggingsUrl,
  deleteRiggingsUrl,
  restoreRiggingsUrl,
  moveRiggingRelevanceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPatch, apiDelete } from '../../api/client';
import { useEntranceContentMutation } from './useEntranceContentMutation';

export const useCreateRigging = () =>
  useEntranceContentMutation(({ entrance, title, obstacles, language }) =>
    apiPost(postRiggingsUrl, { entrance, title, obstacles, language })
  );

export const useUpdateRigging = () =>
  useEntranceContentMutation(({ id, title, obstacles, language }) =>
    apiPatch(putRiggingsUrl(id), { title, obstacles, language })
  );

export const useDeleteRigging = () =>
  useEntranceContentMutation(
    ({ id, isPermanent }) => apiDelete(deleteRiggingsUrl(id, isPermanent)),
    { isInline: true }
  );

export const useRestoreRigging = () =>
  useEntranceContentMutation(({ id }) => apiPost(restoreRiggingsUrl(id)), {
    isInline: true
  });

export const useMoveRiggingRelevance = () =>
  useEntranceContentMutation(({ id, direction }) =>
    apiPatch(moveRiggingRelevanceUrl(id), { direction })
  );
