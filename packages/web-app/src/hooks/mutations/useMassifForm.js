import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postCreateMassifUrl,
  putMassifUrl,
  markMassifSensitiveUrl,
  unmarkMassifSensitiveUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut } from '../../api/client';
import { massifKeys } from '../../api/queryKeys';

const invalidateMassifs = queryClient =>
  queryClient.invalidateQueries({ queryKey: massifKeys.all });

export const useCreateMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: data => apiPost(postCreateMassifUrl, data),
    onSuccess: () => invalidateMassifs(queryClient)
  });
};

export const useUpdateMassif = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: body => apiPut(putMassifUrl(body.id), body),
    onSuccess: () => invalidateMassifs(queryClient)
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
