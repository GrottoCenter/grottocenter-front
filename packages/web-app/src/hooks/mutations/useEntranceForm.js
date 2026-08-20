import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postCreateEntranceUrl,
  putEntranceUrl,
  putEntranceWithNewEntitiesUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';
import { invalidateAll, invalidateTileAt } from '../../utils/mapTileCache';

// Entrance form mutations. Both Create and Update invalidate the entrance
// details cache and the map tile caches (entrances + networks projection)
// so a moderator who edits an entrance sees the map redraw its markers
// without a reload.
//
// The map tile refresh prefers `invalidateTileAt` when the response carries
// coords (mirrors the legacy invalidateAtOrFallback middleware): a full
// invalidateAll nukes every cached tile the user has explored, so panning
// after a single create/update kicks off a burst of refetches.
const invalidateEntranceAndMap = (queryClient, response) => {
  queryClient.invalidateQueries({ queryKey: entranceKeys.all });
  const latitude = response?.latitude;
  const longitude = response?.longitude;
  if (latitude != null && longitude != null) {
    invalidateTileAt('entrances', latitude, longitude);
    invalidateTileAt('networks', latitude, longitude);
  } else {
    invalidateAll('entrances');
    invalidateAll('networks');
  }
};

export const useCreateEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: data => apiPost(postCreateEntranceUrl, data),
    onSuccess: response => invalidateEntranceAndMap(queryClient, response)
  });
};

export const useUpdateEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: entranceData =>
      apiPut(putEntranceUrl(entranceData.id), entranceData),
    onSuccess: response => invalidateEntranceAndMap(queryClient, response)
  });
};

// Bulk update: entrance plus newly-created child collections (names,
// descriptions, locations, riggings, comments). Used by the "duplicate
// merge" flow, where the moderator saves the entrance body and the freshly
// picked children in one shot.
export const useUpdateEntranceWithNewEntities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entrance,
      newNames,
      newDescriptions,
      newLocations,
      newRiggings,
      newComments
    }) =>
      apiPut(putEntranceWithNewEntitiesUrl(entrance.id), {
        entrance,
        newNames,
        newDescriptions,
        newLocations,
        newRiggings,
        newComments
      }),
    onSuccess: response => invalidateEntranceAndMap(queryClient, response)
  });
};
