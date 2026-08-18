import { useSelector } from 'react-redux';

export function useUserProperties() {
  const authState = useSelector(state => state.login);
  // Match the synthetic "Anonymous" impersonation with the "not logged in"
  // identity so ownership/self-checks that read from here (nickname, id, …)
  // stop recognising the real admin. See ImpersonationIndicator.
  if (authState.impersonatedRole === 'Anonymous') return {};
  return authState.authTokenDecoded ?? {};
}
