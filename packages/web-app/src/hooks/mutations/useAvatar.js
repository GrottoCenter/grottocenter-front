import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiPutForm } from '@/api/client';
import {
  accountKeys,
  avatarMutationKeys,
  organizationKeys,
  personKeys
} from '@/api/queryKeys';
import { accountAvatarUrl, organizationAvatarUrl } from '@/conf/apiRoutes';

export const useAvatar = ({ personId = null, organizationId = null }) => {
  const queryClient = useQueryClient();
  const isOrganization = organizationId != null;
  return useMutation({
    mutationKey: isOrganization
      ? avatarMutationKeys.organization(organizationId)
      : avatarMutationKeys.account(),
    meta: { errorPresentation: 'inline' },
    mutationFn: file => {
      const url = isOrganization
        ? organizationAvatarUrl(organizationId)
        : accountAvatarUrl;
      if (!file) return apiDelete(url);
      const form = new FormData();
      form.append('file', file);
      return apiPutForm(url, form);
    },
    onSuccess: async data => {
      const keys = isOrganization
        ? [organizationKeys.detail(organizationId)]
        : [accountKeys.current(), personKeys.detail(personId)];
      await Promise.all(
        keys.map(queryKey => queryClient.cancelQueries({ queryKey }))
      );
      keys.forEach(queryKey => {
        queryClient.setQueryData(queryKey, current =>
          current ? { ...current, avatarUrl: data?.avatarUrl ?? null } : current
        );
      });
      await Promise.all(
        keys.map(queryKey => queryClient.invalidateQueries({ queryKey }))
      );
    }
  });
};
