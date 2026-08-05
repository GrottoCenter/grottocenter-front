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
  return {
    isAdmin: hasRole(authState, 'Administrator'),
    isAuth: authState.authTokenDecoded !== null && !isTokenExpired(authState),
    isLeader: hasRole(authState, 'Leader'),
    isModerator: hasRole(authState, 'Moderator'),
    isTokenExpired: isTokenExpired(authState),
    isUser: hasRole(authState, 'User')
  };
}
