import {
  postHistoryUrl,
  putHistoryUrl,
  deleteHistoryUrl,
  restoreHistoryUrl,
  moveHistoryRelevanceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut, apiPatch, apiDelete } from '../../api/client';
import { useEntranceContentMutation } from './useEntranceContentMutation';

export const useCreateHistory = () =>
  useEntranceContentMutation(({ entrance, title, body, language }) =>
    apiPost(postHistoryUrl, { entrance, title, body, language })
  );

export const useUpdateHistory = () =>
  useEntranceContentMutation(({ id, title, body, language }) =>
    apiPut(putHistoryUrl(id), { title, body, language })
  );

export const useDeleteHistory = () =>
  useEntranceContentMutation(
    ({ id, isPermanent }) => apiDelete(deleteHistoryUrl(id, isPermanent)),
    { isInline: true }
  );

export const useRestoreHistory = () =>
  useEntranceContentMutation(({ id }) => apiPost(restoreHistoryUrl(id)), {
    isInline: true
  });

export const useMoveHistoryRelevance = () =>
  useEntranceContentMutation(({ id, direction }) =>
    apiPatch(moveHistoryRelevanceUrl(id), { direction })
  );
