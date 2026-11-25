import { configureStore } from '@reduxjs/toolkit';

import {
  fetchLogin,
  fetchLoginFailure,
  fetchLoginMfaRequired,
  fetchLoginMfaEnrollmentRequired,
  fetchLoginSuccess,
  logout
} from '@/actions/Login';
import store from '@/store';
import sessionTraceMiddleware from './sessionTraceMiddleware';
import { getSessionTraceId } from './sessionTraceId';

it('keeps the anonymous id through failed login and intermediate MFA steps', () => {
  const first = getSessionTraceId();
  const next = vi.fn(action => action);
  const dispatch = sessionTraceMiddleware()(next);
  [
    fetchLogin(),
    fetchLoginFailure({ message: 'Invalid credentials' }),
    fetchLoginMfaRequired(),
    fetchLoginMfaEnrollmentRequired('enrollment-token'),
    { type: 'UNRELATED_ACTION' }
  ].forEach(action => {
    expect(dispatch(action)).toBe(action);
    expect(getSessionTraceId()).toBe(first);
  });
});

it.each([fetchLoginSuccess({ id: 1 }, 'token'), logout()])(
  'renews before reducers and subscribers handle $type',
  action => {
    const first = getSessionTraceId();
    const ids = [];
    const testStore = configureStore({
      reducer: (state = {}) => {
        ids.push(getSessionTraceId());
        return state;
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(sessionTraceMiddleware)
    });
    ids.length = 0;
    const unsubscribe = testStore.subscribe(() => {
      ids.push(getSessionTraceId());
    });
    testStore.dispatch(action);
    unsubscribe();
    expect(ids).toEqual([getSessionTraceId(), getSessionTraceId()]);
    expect(getSessionTraceId()).not.toBe(first);
  }
);

it('wires login and logout renewal into the application store', () => {
  const anonymous = getSessionTraceId();
  store.dispatch(fetchLoginSuccess({ id: 1 }, 'test-token'));
  const authenticated = getSessionTraceId();
  expect(authenticated).not.toBe(anonymous);
  store.dispatch(logout());
  expect(getSessionTraceId()).not.toBe(authenticated);
  expect(getSessionTraceId()).not.toBe(anonymous);
});
