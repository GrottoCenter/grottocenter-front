import { useSelector } from 'react-redux';

export function useUserProperties() {
  const authState = useSelector(state => state.login);
  return authState.authTokenDecoded ?? {};
}
