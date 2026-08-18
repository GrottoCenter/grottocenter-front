import { useSelector } from 'react-redux';
import { hasRole } from '../helpers/AuthHelper';

const isTokenExpired = authState => {
  try {
    if (authState.authTokenDecoded.exp < Date.now() / 1000) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export function usePermissions() {
  const authState = useSelector(state => state.login);
  // "Anonymous" impersonation is our synthetic role for "not logged in": the
  // UI must behave as if no session existed — login button in the AppBar,
  // PrivateRoutes blocked, private queries disabled. Every other impersonated
  // role keeps isAuth true so the app still has a session to hang requests
  // off. We use a name distinct from the Visitor group in GroupHelper to
  // avoid conflating "user with the Visitor role" and "not logged in".
  const isAnonymousMode = authState.impersonatedRole === 'Anonymous';
  const hasLiveSession =
    authState.authTokenDecoded !== null && !isTokenExpired(authState);
  return {
    isAdmin: hasRole(authState, 'Administrator'),
    isAuth: hasLiveSession && !isAnonymousMode,
    isLeader: hasRole(authState, 'Leader'),
    isModerator: hasRole(authState, 'Moderator'),
    isTokenExpired: isTokenExpired(authState),
    isUser: hasRole(authState, 'User'),
    // Ignore-impersonation flag so the ImpersonationIndicator and its
    // launcher stay visible when a real admin is currently masquerading as a
    // lower role.
    isRealAdmin: hasRole(authState, 'Administrator', {
      ignoreImpersonation: true
    }),
    isImpersonating: Boolean(authState.impersonatedRole),
    impersonatedRole: authState.impersonatedRole ?? null
  };
}
