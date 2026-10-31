import {
  postLocationUrl,
  putLocationUrl,
  deleteLocationUrl,
  restoreLocationUrl,
  moveLocationRelevanceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut, apiPatch, apiDelete } from '../../api/client';
import { useEntranceContentMutation } from './useEntranceContentMutation';

export const useCreateLocation = () =>
  useEntranceContentMutation(({ entrance, title, body, language }) =>
    apiPost(postLocationUrl, { entrance, title, body, language })
  );

export const useUpdateLocation = () =>
  useEntranceContentMutation(({ id, title, body, language }) =>
    apiPut(putLocationUrl(id), { title, body, language })
  );

export const useDeleteLocation = () =>
  useEntranceContentMutation(
    ({ id, isPermanent }) => apiDelete(deleteLocationUrl(id, isPermanent)),
    { isInline: true }
  );

export const useRestoreLocation = () =>
  useEntranceContentMutation(({ id }) => apiPost(restoreLocationUrl(id)), {
    isInline: true
  });

export const useMoveLocationRelevance = () =>
  useEntranceContentMutation(({ id, direction }) =>
    apiPatch(moveLocationRelevanceUrl(id), { direction })
  );
