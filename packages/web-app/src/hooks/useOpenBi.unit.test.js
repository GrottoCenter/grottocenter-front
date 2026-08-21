import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useOpenBi } from './useOpenBi';

const mockDispatch = vi.fn();
const mockAuthState = {
  login: { authorizationHeader: { Authorization: 'Bearer test-token' } }
};
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch
}));

// api/client reads the auth header from the store at call time; the mock
// store just needs a getState() shim that returns login.authorizationHeader.
vi.mock('../store', () => ({
  default: { getState: () => mockAuthState }
}));

vi.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: ({ id }) => id })
}));

const mockOnError = vi.fn();
vi.mock('./useNotification', () => ({
  useNotification: () => ({ onError: mockOnError })
}));

let mockIsAuth = true;
vi.mock('./usePermissions', () => ({
  usePermissions: () => ({ isAuth: mockIsAuth })
}));

vi.mock('../actions/Login', () => ({
  displayLoginDialog: () => ({ type: 'DISPLAY_LOGIN_DIALOG' }),
  postLogout: () => ({ type: 'POST_LOGOUT' })
}));

const mockWindow = { name: 'gcBiTab', close: vi.fn() };
let submitSpy;

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAuth = true;
  window.open = vi.fn(() => mockWindow);
  submitSpy = vi
    .spyOn(HTMLFormElement.prototype, 'submit')
    .mockImplementation(() => {});
  global.fetch = vi.fn();
});

afterEach(() => {
  submitSpy.mockRestore();
});

describe('useOpenBi', () => {
  it('prompts login without opening a tab or calling the API when logged out', async () => {
    mockIsAuth = false;
    const { result } = renderHook(() => useOpenBi());

    await act(async () => {
      await result.current.openBi();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DISPLAY_LOGIN_DIALOG' });
  });

  it('requests an SSO token and submits the form when logged in', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'sso-jwt' })
    });
    const { result } = renderHook(() => useOpenBi());

    await act(async () => {
      await result.current.openBi();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/sso/auth-token');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-token');
    expect(JSON.parse(options.body)).toEqual({ product: 'superset' });
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(mockWindow.close).not.toHaveBeenCalled();
  });

  it('auto-resumes openBi after the user logs in', async () => {
    mockIsAuth = false;
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'sso-jwt' })
    });

    const { result, rerender } = renderHook(() => useOpenBi());

    await act(async () => {
      await result.current.openBi();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DISPLAY_LOGIN_DIALOG' });
    expect(global.fetch).not.toHaveBeenCalled();

    mockIsAuth = true;
    await act(async () => {
      rerender();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });

  it('shows an error toast and closes the tab when the API fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'server error' })
    });
    const { result } = renderHook(() => useOpenBi());

    await act(async () => {
      await result.current.openBi();
    });

    expect(submitSpy).not.toHaveBeenCalled();
    expect(mockWindow.close).toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(
      'Unable to open the statistics dashboard. Please try again.'
    );
  });

  it('dispatches postLogout on a 401 and skips the toast', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'unauthorized' })
    });
    const { result } = renderHook(() => useOpenBi());

    await act(async () => {
      await result.current.openBi();
    });

    expect(submitSpy).not.toHaveBeenCalled();
    expect(mockWindow.close).toHaveBeenCalled();
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'POST_LOGOUT' });
  });
});
