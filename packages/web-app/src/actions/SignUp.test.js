import fetch from 'isomorphic-fetch';
import {
  postSignUp,
  FETCH_SIGN_UP,
  FETCH_SIGN_UP_SUCCESS,
  FETCH_SIGN_UP_FAILURE
} from './SignUp';

vi.mock('isomorphic-fetch', () => ({ default: vi.fn() }));

const mockDispatch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('postSignUp', () => {
  const payload = {
    email: 'a@b.co',
    language: 'eng',
    name: '',
    nickname: 'nick',
    password: 'P@ssw0rd1234',
    surname: '',
    website: '',
    captchaToken: 'tok'
  };

  it('dispatches SUCCESS and sends JSON content-type on a 2xx response', async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 200 });

    await postSignUp(payload)(mockDispatch);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/signup'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith({ type: FETCH_SIGN_UP });
    expect(mockDispatch).toHaveBeenCalledWith({ type: FETCH_SIGN_UP_SUCCESS });
  });

  it.each([
    ['CAPTCHA_MISSING', 400],
    ['CAPTCHA_INVALID', 400]
  ])(
    'extracts the error code from a JSON body { error: "%s" }',
    async (code, status) => {
      const body = { error: code };
      fetch.mockResolvedValueOnce({
        ok: false,
        status,
        clone: () => ({ json: () => Promise.resolve(body) }),
        text: () => Promise.resolve(JSON.stringify(body))
      });

      await postSignUp(payload)(mockDispatch);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: FETCH_SIGN_UP_FAILURE,
        error: { code, message: null, status }
      });
    }
  );

  it('surfaces CAPTCHA_SERVICE_UNAVAILABLE with status 503', async () => {
    const body = { error: 'CAPTCHA_SERVICE_UNAVAILABLE' };
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      clone: () => ({ json: () => Promise.resolve(body) }),
      text: () => Promise.resolve(JSON.stringify(body))
    });

    await postSignUp(payload)(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: FETCH_SIGN_UP_FAILURE,
      error: {
        code: 'CAPTCHA_SERVICE_UNAVAILABLE',
        message: null,
        status: 503
      }
    });
  });

  it('falls back to response text when the body is not JSON', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      clone: () => ({ json: () => Promise.reject(new Error('not json')) }),
      text: () => Promise.resolve('Email already used')
    });

    await postSignUp(payload)(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: FETCH_SIGN_UP_FAILURE,
      error: { code: null, message: 'Email already used', status: 409 }
    });
  });

  it('dispatches FAILURE with null code/status on a network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await postSignUp(payload)(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: FETCH_SIGN_UP_FAILURE,
      error: { code: null, message: 'Network error', status: null }
    });
  });
});
