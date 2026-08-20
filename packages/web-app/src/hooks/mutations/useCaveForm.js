import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postCreateCaveUrl,
  putCaveUrl,
  postCreateEntranceUrl,
  putEntranceUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut } from '../../api/client';
import { caveKeys, entranceKeys } from '../../api/queryKeys';
import { invalidateAll, invalidateTileAt } from '../../utils/mapTileCache';

// Networks on the map are the projection of caves — every create/update
// touches the networks tile cache so a moderator sees the marker move.
const invalidateCaveAndMap = queryClient => {
  queryClient.invalidateQueries({ queryKey: caveKeys.all });
  invalidateAll('networks');
};

export const useCreateCave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: data => apiPost(postCreateCaveUrl, data),
    onSuccess: () => invalidateCaveAndMap(queryClient)
  });
};

export const useUpdateCave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: body => apiPut(putCaveUrl(body.id), body),
    onSuccess: () => invalidateCaveAndMap(queryClient)
  });
};

// The combined "create a network AND its first entrance" flow: create the
// cave first, then attach the entrance to the returned id. Not a real
// server endpoint — a client-side chain the old thunk carried; kept here
// so the form still calls one hook.
export const useCreateCaveAndEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caveData, entranceData }) => {
      const cave = await apiPost(postCreateCaveUrl, caveData);
      const entrance = await apiPost(postCreateEntranceUrl, {
        ...entranceData,
        cave: cave.id
      });
      return { cave, entrance };
    },
    onSuccess: ({ entrance } = {}) => {
      queryClient.invalidateQueries({ queryKey: caveKeys.all });
      queryClient.invalidateQueries({ queryKey: entranceKeys.all });
      // Same targeted-then-fallback pattern as useCreateEntrance so a new
      // cave+entrance pair doesn't invalidate every cached tile.
      const latitude = entrance?.latitude;
      const longitude = entrance?.longitude;
      if (latitude != null && longitude != null) {
        invalidateTileAt('entrances', latitude, longitude);
        invalidateTileAt('networks', latitude, longitude);
      } else {
        invalidateAll('entrances');
        invalidateAll('networks');
      }
    }
  });
};

// Combined update — the old thunk ran both PUTs in parallel and swallowed
// individual failures via Promise.all. Preserved here: we surface success
// only when both land.
export const useUpdateCaveAndEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caveData, entranceData }) =>
      Promise.all([
        apiPut(putCaveUrl(caveData.id), caveData),
        apiPut(putEntranceUrl(entranceData.id), entranceData)
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caveKeys.all });
      queryClient.invalidateQueries({ queryKey: entranceKeys.all });
      invalidateAll('entrances');
      invalidateAll('networks');
    }
  });
};
