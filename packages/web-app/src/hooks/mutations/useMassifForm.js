import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postCreateMassifUrl,
  putMassifUrl,
  markMassifSensitiveUrl,
  unmarkMassifSensitiveUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut } from '../../api/client';
import { massifKeys, statsKeys } from '../../api/queryKeys';

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

export const useCreateMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: data => apiPost(postCreateMassifUrl, data),
    onSuccess: () => {
      invalidateMassifs(queryClient);
      invalidateStats(queryClient);
    }
  });
};

export const useUpdateMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: body => apiPut(putMassifUrl(body.id), body),
    onSuccess: () => {
      invalidateMassifs(queryClient);
      invalidateStats(queryClient);
    }
  });
};

export const useMarkMassifSensitive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: id => apiPost(markMassifSensitiveUrl(id)),
    onSuccess: () => invalidateMassifs(queryClient)
  });
};

export const useUnmarkMassifSensitive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: id => apiPost(unmarkMassifSensitiveUrl(id)),
    onSuccess: () => invalidateMassifs(queryClient)
  });
};
