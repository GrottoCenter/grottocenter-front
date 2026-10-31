import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeEntityDeletion } from '@/utils/entityDeletionCache';

import {
  postPersonUrl,
  putCaverUrl,
  deletePersonUrl,
  postPersonGroupsUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut, apiDelete } from '../../api/client';
import { listKeys, personKeys } from '../../api/queryKeys';

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

// Always permanent: CAVER requires Administrator, AUTHOR requires Moderator.
// `entityId` is the optional person to merge into, not the acting moderator.
export const useDeletePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorPresentation: 'inline' },
    networkMode: 'always',
    mutationFn: ({ id, entityId }) => apiDelete(deletePersonUrl(id, entityId)),
    onSuccess: (data, variables) =>
      completeEntityDeletion(queryClient, personKeys, data, {
        ...variables,
        isPermanent: true
      })
  });
};

// Admin: rewrite the caver's group memberships in one shot. Invalidates the
// group-lists board (ManageUsers) too so the newly-added moderator/leader
// shows up without a refresh.
export const useUpdatePersonGroups = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, groups }) =>
      apiPost(postPersonGroupsUrl(id), { groups }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: listKeys.groups() });
    }
  });
};
