import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postCreateMassifUrl,
  putMassifUrl,
  markMassifSensitiveUrl,
  unmarkMassifSensitiveUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut } from '../../api/client';
import {
  entranceKeys,
  massifKeys,
  massifPreviewKeys,
  statsKeys
} from '../../api/queryKeys';

const invalidateMassifs = queryClient =>
  queryClient.invalidateQueries({ queryKey: massifKeys.all });

// Polygon create/update rewires which entrances belong to the massif — the
// three per-entity stats views (massif/country/region) all read from that
// containment join, so any of them can shift on a save. Invalidating the
// whole stats domain is the safe minimum until the back exposes a targeted
// refresh signal. Homepage counters share the root and re-fetch too; those
// GETs are cheap.
const invalidateStats = queryClient =>
  queryClient.invalidateQueries({ queryKey: statsKeys.all });

const invalidateEntrances = queryClient =>
  queryClient.invalidateQueries({ queryKey: entranceKeys.all });

const invalidateMassifPreview = (queryClient, massifId) =>
  queryClient.invalidateQueries({
    queryKey: massifPreviewKeys.sensitive(massifId)
  });

export const useCreateMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: data => apiPost(postCreateMassifUrl, data),
    onSuccess: () =>
      Promise.all([
        invalidateMassifs(queryClient),
        invalidateStats(queryClient),
        invalidateEntrances(queryClient)
      ])
  });
};

export const useUpdateMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: body => apiPut(putMassifUrl(body.id), body),
    onSuccess: (_massif, body) => {
      const invalidations = [
        invalidateMassifs(queryClient),
        invalidateStats(queryClient),
        invalidateMassifPreview(queryClient, body.id)
      ];
      if (body.geogPolygon !== undefined) {
        invalidations.push(invalidateEntrances(queryClient));
      }
      return Promise.all(invalidations);
    }
  });
};

export const useSetMassifSensitiveLock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isSensitiveLocked }) =>
      apiPut(putMassifUrl(id), { isSensitiveLocked }),
    onSuccess: () => invalidateMassifs(queryClient)
  });
};

export const useMarkMassifSensitive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: id => apiPost(markMassifSensitiveUrl(id)),
    onSuccess: (_massif, id) =>
      Promise.all([
        invalidateMassifs(queryClient),
        invalidateEntrances(queryClient),
        invalidateMassifPreview(queryClient, id)
      ])
  });
};

export const useUnmarkMassifSensitive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: id => apiPost(unmarkMassifSensitiveUrl(id)),
    onSuccess: (_massif, id) =>
      Promise.all([
        invalidateMassifs(queryClient),
        invalidateMassifPreview(queryClient, id)
      ])
  });
};
