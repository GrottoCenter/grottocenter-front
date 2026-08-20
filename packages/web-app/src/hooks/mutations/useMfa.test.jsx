import { renderHook, act } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache
} from '@tanstack/react-query';
import PropTypes from 'prop-types';

import store from '../../store';
import { postLogout } from '../../actions/Login';
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

// Rebuild the production MutationCache/QueryCache wiring in the test so
// meta.skip401Logout actually gates a dispatchable POST_LOGOUT. A bare
// createTestQueryClient would install no onError handler, and every
// "postLogout never fires" assertion below would be vacuously green —
// removing the meta flag from useMfa* would leave CI green while breaking
// production. Ties directly to conf/queryClient.js#notifyError.
const dispatchLogoutOn401 = (error, meta) => {
  // Uses the mocked store above; postLogout is also mocked to a plain
  // { type: 'POST_LOGOUT' } action so the assertion is easy to write.
  if (error?.status === 401 && !meta?.skip401Logout) {
    store.dispatch(postLogout());
  }
};

const createProductionLikeQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => dispatchLogoutOn401(error, query.meta)
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        dispatchLogoutOn401(error, mutation.meta)
    }),
    defaultOptions: {
      queries: { retry: false, networkMode: 'always', gcTime: Infinity },
      mutations: { retry: false, networkMode: 'always' }
    }
  });

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
    queryClient = createProductionLikeQueryClient();
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
