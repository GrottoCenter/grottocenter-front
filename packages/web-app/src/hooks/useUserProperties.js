import { useSelector } from 'react-redux';
import { hasRole } from '../helpers/AuthHelper';

export function useUserProperties() {
  const authState = useSelector(state => state.login);
  // Match the synthetic "Anonymous" impersonation with the "not logged in"
  // identity so ownership/self-checks that read from here (nickname, id, …)
  // stop recognising the real admin. See ImpersonationIndicator.
  const isRealAdmin = hasRole(authState, 'Administrator', {
    ignoreImpersonation: true
  });
  if (isRealAdmin && authState.impersonatedRole === 'Anonymous') return {};
  return authState.authTokenDecoded ?? {};
}
