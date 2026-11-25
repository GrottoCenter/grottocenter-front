import { FETCH_LOGIN_SUCCESS, LOGOUT } from '@/actions/Login';
import { renewSessionTraceId } from './sessionTraceId';

const sessionTraceMiddleware = () => next => action => {
  // Renew before subscribers can start requests for the new session. Failed
  // login attempts and intermediate MFA steps keep the anonymous visit id.
  if (action.type === FETCH_LOGIN_SUCCESS || action.type === LOGOUT) {
    renewSessionTraceId();
  }
  return next(action);
};

export default sessionTraceMiddleware;
