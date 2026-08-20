import { useSelector } from 'react-redux';
import { hasRole } from '../helpers/AuthHelper';

export function useUserProperties() {
  const authState = useSelector(state => state.login);
  // Only Anonymous collapses identity so ownership/self-checks stop matching
  // the real admin. Other role previews intentionally keep the real token so
  // personal content and profile data continue to load: this previews UI
  // visibility, not another user's identity. See ImpersonationIndicator.
  const isRealAdmin = hasRole(authState, 'Administrator', {
    ignoreImpersonation: true
  });
  if (isRealAdmin && authState.impersonatedRole === 'Anonymous') return {};
  return authState.authTokenDecoded ?? {};
}
