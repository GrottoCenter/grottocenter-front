import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postCreateEntranceUrl,
  putEntranceUrl,
  putEntranceWithNewEntitiesUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut } from '../../api/client';
import { entranceKeys } from '../../api/queryKeys';
import { invalidateAll } from '../../utils/mapTileCache';

// Entrance form mutations. Both Create and Update invalidate the entrance
// details cache and the map tile caches (entrances + networks projection)
// so a moderator who edits an entrance sees the map redraw its markers
// without a reload.
const invalidateEntranceAndMap = queryClient => {
  queryClient.invalidateQueries({ queryKey: entranceKeys.all });
  invalidateAll('entrances');
  invalidateAll('networks');
};

export const useCreateEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: data => apiPost(postCreateEntranceUrl, data),
    onSuccess: () => invalidateEntranceAndMap(queryClient)
  });
};

export const useUpdateEntrance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: entranceData =>
      apiPut(putEntranceUrl(entranceData.id), entranceData),
    onSuccess: () => invalidateEntranceAndMap(queryClient)
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
    onSuccess: () => invalidateEntranceAndMap(queryClient)
  });
};
