import { useSelector } from 'react-redux';

const isTokenExpired = authState => {
  try {
    if (authState.authTokenDecoded.exp < Date.now() / 1000) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

const hasRole = (authState, roleName) => {
  const groups = authState?.authTokenDecoded?.groups ?? null;
  if (groups === null) return false;
  return groups.some(g => g.name === roleName);
};

// eslint-disable-next-line import/prefer-default-export
export function usePermissions() {
  const authState = useSelector(state => state.login);
  return {
    isAdmin: hasRole(authState, 'Administrator'),
    isAuth: authState.authTokenDecoded !== null && !isTokenExpired(),
    isLeader: hasRole(authState, 'Leader'),
    isModerator: hasRole(authState, 'Moderator'),
    isTokenExpired: isTokenExpired(),
    isUser: hasRole(authState, 'User')
  };
}
