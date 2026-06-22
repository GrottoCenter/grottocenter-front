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

const mockEnqueueSnackbar = jest.fn();
jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar })
}));

let mockIsAuth = true;
jest.mock('./usePermissions', () => ({
  usePermissions: () => ({ isAuth: mockIsAuth })
}));

jest.mock('../actions/Login', () => ({
  displayLoginDialog: () => ({ type: 'DISPLAY_LOGIN_DIALOG' })
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
  it('prompts login and does not call the API when logged out', async () => {
    mockIsAuth = false;
    const { result } = renderHook(() => useOpenBi());

    await act(async () => {
      await result.current.openBi();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DISPLAY_LOGIN_DIALOG' });
    expect(mockWindow.close).toHaveBeenCalled();
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
    global.fetch.mockResolvedValue({ ok: false, status: 500 });
    const { result } = renderHook(() => useOpenBi());

    await act(async () => {
      await result.current.openBi();
    });

    expect(submitSpy).not.toHaveBeenCalled();
    expect(mockWindow.close).toHaveBeenCalled();
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Unable to open the statistics dashboard. Please try again.',
      { variant: 'error' }
    );
  });
});
