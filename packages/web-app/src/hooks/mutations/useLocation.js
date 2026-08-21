import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postLocationUrl,
  putLocationUrl,
  deleteLocationUrl,
  restoreLocationUrl,
  moveLocationRelevanceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPatch, apiDelete } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';

// Locations are Entrance-only. Invalidating entranceKeys.all is the cheapest
// correct move — only the currently mounted entrance query refetches.
const useLocationMutation = mutationFn => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: entranceKeys.all })
  });
};

export const useCreateLocation = () =>
  useLocationMutation(({ entrance, title, body, language }) =>
    apiPost(postLocationUrl, { entrance, title, body, language })
  );

export const useUpdateLocation = () =>
  useLocationMutation(({ id, title, body, language }) =>
    apiPatch(putLocationUrl(id), { title, body, language })
  );

export const useDeleteLocation = () =>
  useLocationMutation(({ id, isPermanent }) =>
    apiDelete(deleteLocationUrl(id, isPermanent))
  );

export const useRestoreLocation = () =>
  useLocationMutation(({ id }) => apiPost(restoreLocationUrl(id)));

export const useMoveLocationRelevance = () =>
  useLocationMutation(({ id, direction }) =>
    apiPatch(moveLocationRelevanceUrl(id), { direction })
  );
