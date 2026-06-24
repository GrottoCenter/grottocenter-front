import { renderHook, act } from '@testing-library/react';
import { useOpenBi } from './useOpenBi';

const mockDispatch = jest.fn();
const mockAuthState = {
  login: { authorizationHeader: { Authorization: 'Bearer test-token' } }
};
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockAuthState)
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: ({ id }) => id })
}));

const mockOnError = jest.fn();
jest.mock('./useNotification', () => ({
  useNotification: () => ({ onError: mockOnError })
}));

let mockIsAuth = true;
jest.mock('./usePermissions', () => ({
  usePermissions: () => ({ isAuth: mockIsAuth })
}));

jest.mock('../actions/Login', () => ({
  displayLoginDialog: () => ({ type: 'DISPLAY_LOGIN_DIALOG' })
}));

// Use the real checkAuthStatus, but it lazy-requires ./Login on a 401 only.
jest.mock('../actions/utils', () => ({
  checkAuthStatus: () => response => {
    if (response.status === 401) {
      const err = new Error('Unauthorized');
      err.isAuthError = true;
      throw err;
    }
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    return response;
  }
}));

const mockWindow = { name: 'gcBiTab', close: jest.fn() };
let submitSpy;

beforeEach(() => {
  jest.clearAllMocks();
  mockIsAuth = true;
  window.open = jest.fn(() => mockWindow);
  submitSpy = jest
    .spyOn(HTMLFormElement.prototype, 'submit')
    .mockImplementation(() => {});
  global.fetch = jest.fn();
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

  it('skips the error toast on a 401 (auth error triggers logout)', async () => {
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
  });
});
