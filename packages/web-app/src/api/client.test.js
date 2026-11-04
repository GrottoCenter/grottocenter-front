import store from '@/store';
import { fetchLoginSuccess, logout } from '@/actions/Login';
import { apiFetch, apiGetWithRange, apiPost } from './client';

it.each(['GET', 'POST', 'raw'])(
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

describe('raw authenticated transport', () => {
  afterEach(() => {
    store.dispatch(logout());
    vi.unstubAllGlobals();
  });

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
