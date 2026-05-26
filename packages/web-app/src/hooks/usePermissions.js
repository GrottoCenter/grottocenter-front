import { useSelector } from 'react-redux';
import { hasRole } from '../helpers/AuthHelper';

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

// eslint-disable-next-line import/prefer-default-export
export function usePermissions() {
  const authState = useSelector(state => state.login);
  return {
    isAdmin: true, //hasRole(authState, 'Administrator'),
    isAuth: authState.authTokenDecoded !== null && !isTokenExpired(),
    isLeader: hasRole(authState, 'Leader'),
    isModerator: hasRole(authState, 'Moderator'),
    isTokenExpired: isTokenExpired(),
    isUser: hasRole(authState, 'User')
  };
}
