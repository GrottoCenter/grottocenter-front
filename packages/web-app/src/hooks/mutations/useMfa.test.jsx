import { renderHook, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { createTestQueryClient } from '../../test/renderWithProviders';
import { useMfaVerify, useMfaLogin, useMfaEnroll } from './useMfa';

// Redux store mock — used both by useMfa's raw fetch helper (reads
// login.enrollmentToken and login.authorizationHeader) and by the query
// client's global error handler (dispatches postLogout on 401).
const mockDispatch = vi.fn();
const mockState = {
  login: {
    enrollmentToken: 'enrollment-token-xyz',
    authorizationHeader: { Authorization: 'Bearer session-token' }
  },
  intl: { locale: 'en', messages: { en: {} } }
};
vi.mock('../../store', () => ({
  default: {
    getState: () => mockState,
    dispatch: (...args) => mockDispatch(...args)
  }
}));

vi.mock('../../actions/Login', () => ({
  postLogout: () => ({ type: 'POST_LOGOUT' }),
  fetchLoginSuccess: () => ({ type: 'FETCH_LOGIN_SUCCESS' }),
  hideLoginDialog: () => ({ type: 'HIDE_LOGIN_DIALOG' }),
  decodeJWT: () => ({ id: 1 })
}));

// notistack: block the toast side-effect from the queryClient handler under
// test — we only check whether postLogout was dispatched or not.
vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }));

const makeWrapper = client => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node };
  return Wrapper;
};

describe('useMfa mutations (regression: 401 must not sign the user out)', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockDispatch.mockReset();
    global.fetch = vi.fn();
  });

  it('useMfaVerify: 401 with InvalidTotpCode does not dispatch postLogout', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ status: 'InvalidTotpCode' })
    });

    const { result } = renderHook(() => useMfaVerify(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('123456');
      } catch {
        /* expected */
      }
    });

    // The wrong-TOTP path is a form-validation error, not a lost session.
    // Any dispatch that fires would be an app bug — the mocked action
    // creators would show up as { type: 'POST_LOGOUT' } if they did.
    expect(
      mockDispatch.mock.calls.some(([a]) => a?.type === 'POST_LOGOUT')
    ).toBe(false);
  });

  it('useMfaVerify: 401 flags enrollment token expired for non-TOTP statuses', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ status: 'EnrollmentTokenExpired' })
    });

    const { result } = renderHook(() => useMfaVerify(), {
      wrapper: makeWrapper(queryClient)
    });

    let caught;
    await act(async () => {
      try {
        await result.current.mutateAsync('123456');
      } catch (e) {
        caught = e;
      }
    });

    expect(caught?.isEnrollmentTokenExpired).toBe(true);
    // Still no postLogout — the UI drives the fresh-login prompt.
    expect(
      mockDispatch.mock.calls.some(([a]) => a?.type === 'POST_LOGOUT')
    ).toBe(false);
  });

  it('useMfaLogin: 401 (bad password/TOTP) does not dispatch postLogout', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ status: 'InvalidCredentials' })
    });

    const { result } = renderHook(() => useMfaLogin(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          email: 'a@b.co',
          password: 'x',
          code: '000000'
        });
      } catch {
        /* expected */
      }
    });

    expect(
      mockDispatch.mock.calls.some(([a]) => a?.type === 'POST_LOGOUT')
    ).toBe(false);
  });

  it('useMfaEnroll: 401 does not dispatch postLogout', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ status: 'EnrollmentTokenExpired' })
    });

    const { result } = renderHook(() => useMfaEnroll(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      try {
        await result.current.mutateAsync();
      } catch {
        /* expected */
      }
    });

    expect(
      mockDispatch.mock.calls.some(([a]) => a?.type === 'POST_LOGOUT')
    ).toBe(false);
  });
});
