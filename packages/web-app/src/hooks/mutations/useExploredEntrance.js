import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  linkExploredEntranceUrl,
  unlinkExploredEntranceUrl
} from '../../conf/apiRoutes';
import { apiPut, apiDelete } from '../../api/client';
import { entranceKeys, personKeys } from '../../api/queryKeys';

/**
 * Mark an entrance as explored by a caver. Success invalidates both the
 * entrance (its explorer count changes) and the person (the profile's
 * explored-entrances list changes) so any open view re-fetches with fresh
 * data.
 */
export const useLinkExploredEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entranceId, caverId }) =>
      apiPut(linkExploredEntranceUrl(entranceId, caverId)),
    onSuccess: (_data, { entranceId, caverId }) => {
      queryClient.invalidateQueries({
        queryKey: entranceKeys.detail(entranceId)
      });
      queryClient.invalidateQueries({ queryKey: personKeys.detail(caverId) });
    }
  });
};

/**
 * Remove the explored-entrance link. Same invalidation surface as the link
 * mutation — the entrance and the caver profile both need to reflect the
 * change.
 */
export const useUnlinkExploredEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entranceId, caverId }) =>
      apiDelete(unlinkExploredEntranceUrl(entranceId, caverId)),
    onSuccess: (_data, { entranceId, caverId }) => {
      queryClient.invalidateQueries({
        queryKey: entranceKeys.detail(entranceId)
      });
      queryClient.invalidateQueries({ queryKey: personKeys.detail(caverId) });
    }
  });
};
