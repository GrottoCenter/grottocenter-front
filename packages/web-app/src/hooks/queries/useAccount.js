import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accountUrl, notificationPreferencesUrl } from '../../conf/apiRoutes';
import { apiGet, apiPatch } from '../../api/client';
import { accountKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';
import { usePermissions } from '../usePermissions';

/**
 * The current user's own account payload (nickname, email, language,
 * preferences, mfaEnabled, …).
 *
 * Fires only once `isAuth` is true — an anonymous session has nothing to
 * fetch. All mutations that update the caller's own account
 * (useUpdateAccount, MFA verify/reset, language sync, …) invalidate
 * accountKeys.current() on success, so a refetch is triggered without a
 * manual dispatch.
 *
 * Replaces the legacy `account` Redux slice + `fetchAccount()` thunk.
 * The old contract exposed `{ account, isLoading, error }`; this hook
 * exposes the raw useQuery — callers destructure `{ data: account,
 * isPending, error }` (see the "list hooks" convention in the ADR).
 */
export const useAccount = () => {
  const { isAuth } = usePermissions();
  return useQuery({
    queryKey: accountKeys.current(),
    queryFn: () => apiGet(accountUrl),
    enabled: isAuth,
    staleTime: STALE.STANDARD
  });
};

/**
 * Per-user notification preferences (email opt-ins for subscriptions,
 * messages, news alerts). Lives under the `account` domain so a global
 * invalidateQueries({ queryKey: accountKeys.all }) refreshes both this
 * and the account payload together.
 */
export const useNotificationPreferences = () => {
  const { isAuth } = usePermissions();
  return useQuery({
    queryKey: accountKeys.notificationPreferences(),
    queryFn: () => apiGet(notificationPreferencesUrl),
    enabled: isAuth,
    staleTime: STALE.STANDARD
  });
};

/**
 * PATCH the notification preferences. Invalidates the query so any open
 * consumer re-reads the persisted values without a manual refetch.
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prefs => apiPatch(notificationPreferencesUrl, prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountKeys.notificationPreferences()
      });
    }
  });
};

export default useAccount;
