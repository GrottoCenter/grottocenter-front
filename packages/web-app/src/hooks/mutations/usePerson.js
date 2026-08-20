import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postPersonUrl,
  putCaverUrl,
  deletePersonUrl,
  postPersonGroupsUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut, apiDelete } from '../../api/client';
import { personKeys } from '../../api/queryKeys';

const invalidatePersons = queryClient =>
  queryClient.invalidateQueries({ queryKey: personKeys.all });

export const useCreatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, surname }) =>
      apiPost(postPersonUrl, { name, surname }),
    onSuccess: () => invalidatePersons(queryClient)
  });
};

export const useUpdatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiPut(putCaverUrl(id), body),
    onSuccess: (_data, { id }) =>
      queryClient.invalidateQueries({ queryKey: personKeys.detail(id) })
  });
};

// Person delete is admin-only and always permanent (the API has no soft
// delete for cavers). `entityId` names the moderator taking the action.
export const useDeletePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entityId }) => apiDelete(deletePersonUrl(id, entityId)),
    onSuccess: (_data, { id }) =>
      queryClient.removeQueries({ queryKey: personKeys.detail(id) })
  });
};

// Admin: rewrite the caver's group memberships in one shot.
export const useUpdatePersonGroups = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, groups }) =>
      apiPost(postPersonGroupsUrl(id), { groups }),
    onSuccess: (_data, { id }) =>
      queryClient.invalidateQueries({ queryKey: personKeys.detail(id) })
  });
};
