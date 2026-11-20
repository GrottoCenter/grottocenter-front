import store from '@/store';
import { fetchLoginSuccess, logout, postLogout } from '@/actions/Login';
import {
  apiFetch,
  apiGetWithRange,
  apiPost,
  apiPostWithHeaders
} from './client';

vi.mock('@/actions/Login', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Keep the real session cleanup; navigation is covered in Cypress.
    postLogout: vi.fn(() => actual.logout())
  };
});

it.each(['GET', 'POST', 'POST with headers', 'raw'])(
  'passes an AbortSignal through to a %s request',
  async method => {
    const controller = new AbortController();
    const fetchMock = vi.fn(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          );
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    try {
      const requests = {
        GET: () =>
          apiGetWithRange('/api/v1/documents', { signal: controller.signal }),
        POST: () =>
          apiPost(
            '/api/v1/advanced-search',
            { entity: 'organizations' },
            { signal: controller.signal }
          ),
        'POST with headers': () =>
          apiPostWithHeaders(
            '/api/v1/advanced-search',
            { entity: 'organizations' },
            { signal: controller.signal }
          ),
        raw: () =>
          apiFetch('/api/v1/advanced-search', { signal: controller.signal })
      };
      const request = requests[method]();
      expect(fetchMock).toHaveBeenCalledWith(
        method === 'GET' ? '/api/v1/documents' : '/api/v1/advanced-search',
        expect.objectContaining({
          signal: controller.signal
        })
      );
      controller.abort();
      await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    } finally {
      vi.unstubAllGlobals();
    }
  }
);

describe('JSON POST response headers', () => {
  afterEach(() => {
    store.dispatch(logout());
    vi.unstubAllGlobals();
  });

  it('returns the body and readable headers while preserving the regular POST contract', async () => {
    const data = { token: 'documents-token' };
    const traceId = '2f85616b-51be-4003-bc07-7d35ed5b72fa';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        async () =>
          new Response(JSON.stringify(data), {
            headers: { 'X-Trace-Id': traceId }
          })
      )
    );
    store.dispatch(fetchLoginSuccess({ id: 1 }, 'session'));
    const result = await apiPostWithHeaders('/api/v1/sso/auth-token', {
      product: 'documents'
    });
    expect(result.data).toEqual(data);
    expect(result.headers.get('X-Trace-Id')).toBe(traceId);
    expect(fetch).toHaveBeenCalledWith('/api/v1/sso/auth-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer session'
      },
      body: JSON.stringify({ product: 'documents' })
    });
    await expect(
      apiPost('/api/v1/sso/auth-token', { product: 'documents' })
    ).resolves.toEqual(data);
  });

  it('returns null data and accessible headers for a 204 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    );
    const result = await apiPostWithHeaders('/api/v1/resource');
    expect(result.data).toBeNull();
    expect(result.headers.get('X-Trace-Id')).toBeNull();
  });

  it.each([
    [401, '{"code":"UNAUTHORIZED","message":"Unauthorized"}'],
    [429, '{}'],
    [502, '<html>Bad gateway</html>'],
    [503, '']
  ])(
    'preserves headers and structured errors on HTTP %i',
    async (status, body) => {
      const headers = new Headers({ 'X-Trace-Id': 'sso-failure-id' });
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockImplementation(
            async () => new Response(body, { status, headers })
          )
      );
      const failure = await apiPostWithHeaders('/api/v1/sso/auth-token', {
        product: 'documents'
      }).catch(error => error);
      expect(failure.status).toBe(status);
      expect(failure.headers.get('X-Trace-Id')).toBe('sso-failure-id');
      if (status === 401) {
        expect(failure).toMatchObject({
          message: 'Unauthorized',
          body: { code: 'UNAUTHORIZED', message: 'Unauthorized' }
        });
      }
      const regularFailure = await apiPost('/api/v1/sso/auth-token', {
        product: 'documents'
      }).catch(error => error);
      expect(regularFailure.status).toBe(status);
      expect(regularFailure).not.toHaveProperty('headers');
    }
  );

  it('preserves response headers when a successful POST returns invalid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>Unexpected response</html>', {
          headers: { 'X-Trace-Id': 'sso-parse-failure' }
        })
      )
    );
    const failure = await apiPostWithHeaders('/api/v1/sso/auth-token', {
      product: 'documents'
    }).catch(error => error);
    // Native Response.json() errors can originate outside Vitest's VM context.
    expect(failure).toMatchObject({ name: 'SyntaxError' });
    expect(failure.headers.get('X-Trace-Id')).toBe('sso-parse-failure');
  });
});

describe('raw authenticated transport', () => {
  afterEach(() => {
    store.dispatch(logout());
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('signs out a rejected map session and returns the unconsumed 401 response', async () => {
    const response = new Response('{"message":"Token has been revoked."}', {
      status: 401
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    store.dispatch(fetchLoginSuccess({ id: 1 }, 'revoked'));

    const result = await apiFetch('/api/v1/geoloc/entrances');

    expect(result).toBe(response);
    expect(result.bodyUsed).toBe(false);
    expect(postLogout).toHaveBeenCalledExactlyOnceWith();
    expect(store.getState().login.authorizationHeader).toBeUndefined();
    expect(localStorage.getItem('grottocenter_token')).toBeNull();
  });

  it('does not log out on an anonymous 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));
    store.dispatch(logout());

    await apiFetch('/api/v1/geoloc/entrances');

    expect(postLogout).not.toHaveBeenCalled();
  });

  it.each(['new-session', null])(
    'ignores a late 401 after the session changes to %s',
    async token => {
      let respond;
      vi.stubGlobal(
        'fetch',
        vi.fn(
          () =>
            new Promise(resolve => {
              respond = resolve;
            })
        )
      );
      store.dispatch(fetchLoginSuccess({ id: 1 }, 'old-session'));
      const request = apiFetch('/api/v1/geoloc/entrances');
      if (token) store.dispatch(fetchLoginSuccess({ id: 2 }, token));
      else store.dispatch(logout());

      respond({ status: 401 });
      await request;

      expect(postLogout).not.toHaveBeenCalled();
      expect(store.getState().login.authorizationHeader).toEqual(
        token ? { Authorization: `Bearer ${token}` } : undefined
      );
    }
  );

  it.each([200, 403, 429, 500])(
    'preserves the signed-in session on HTTP %i',
    async status => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status }));
      store.dispatch(fetchLoginSuccess({ id: 1 }, 'valid-session'));

      await apiFetch('/api/v1/geoloc/entrances');

      expect(postLogout).not.toHaveBeenCalled();
      expect(store.getState().login.authorizationHeader).toEqual({
        Authorization: 'Bearer valid-session'
      });
    }
  );

  it('reads session changes at request time and preserves request options', async () => {
    const response = { status: 429 };
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    const body = JSON.stringify({ query: 'cave' });
    const headers = new Headers({ 'Content-Type': 'application/json' });
    store.dispatch(logout());

    for (const token of [null, 'first', 'second', null]) {
      if (token) store.dispatch(fetchLoginSuccess({ id: 1 }, token));
      else store.dispatch(logout());
      // Complete each request before changing the live session again.
      // eslint-disable-next-line no-await-in-loop
      const result = await apiFetch('/api/v1/advanced-search', {
        method: 'POST',
        headers,
        body,
        cache: 'no-cache'
      });
      expect(result).toBe(response);
      const [, options] = fetchMock.mock.calls.at(-1);
      expect(options).toMatchObject({
        method: 'POST',
        body,
        cache: 'no-cache'
      });
      expect(options.headers.get('Content-Type')).toBe('application/json');
      expect(options.headers.get('Authorization')).toBe(
        token ? `Bearer ${token}` : null
      );
    }
    expect(headers.has('Authorization')).toBe(false);
  });
});
