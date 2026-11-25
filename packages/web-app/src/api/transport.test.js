import { getSessionTraceId, renewSessionTraceId } from './sessionTraceId';
import { fetchWithTrace } from './transport';

const apiConfig = vi.hoisted(() => ({ API_URL: 'https://api.example.org' }));
vi.mock('@/conf/apiRoutes', () => apiConfig);

beforeEach(() => {
  apiConfig.API_URL = 'https://api.example.org';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
});

afterEach(() => vi.unstubAllGlobals());

it.each([
  { Authorization: 'Bearer enrollment', 'Content-Type': 'application/json' },
  new Headers({ Authorization: 'Bearer enrollment' }),
  [['Authorization', 'Bearer enrollment']]
])(
  'adds tracing without mutating caller headers (%j)',
  async originalHeaders => {
    const before = [...new Headers(originalHeaders)];
    const controller = new AbortController();
    const body = new FormData();
    body.append('file', new File(['test'], 'test.pdf'));
    const response = await fetchWithTrace(
      'https://api.example.org/api/v1/mfa',
      {
        method: 'POST',
        headers: originalHeaders,
        body,
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store'
      }
    );
    const [, options] = fetch.mock.calls[0];
    expect(options).toMatchObject({
      method: 'POST',
      body,
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error'
    });
    expect(options.headers.get('Authorization')).toBe('Bearer enrollment');
    expect(options.headers.get('X-Trace-Id')).toBe(getSessionTraceId());
    expect([...new Headers(originalHeaders)]).toEqual(before);
    expect(response.bodyUsed).toBe(false);
  }
);

it('uses the current id, overrides stale caller ids and adds no bearer or content type', async () => {
  const url = new URL('https://API.EXAMPLE.ORG:443/api/v1/account');
  const firstId = getSessionTraceId();
  await fetchWithTrace(url, { headers: { 'x-trace-id': 'stale' } });
  const firstHeaders = fetch.mock.calls[0][1].headers;
  renewSessionTraceId();
  await fetchWithTrace(url);
  const secondHeaders = fetch.mock.calls[1][1].headers;
  expect(firstHeaders.get('X-Trace-Id')).toBe(firstId);
  expect(secondHeaders.get('X-Trace-Id')).toBe(getSessionTraceId());
  expect(secondHeaders.get('X-Trace-Id')).not.toBe(firstId);
  expect(secondHeaders.has('Authorization')).toBe(false);
  expect(secondHeaders.has('Content-Type')).toBe(false);
});

it('supports Request inputs and the fetch rule that init headers replace request headers', async () => {
  const request = new Request('https://api.example.org/api/v1/account', {
    headers: { Authorization: 'Bearer request' }
  });
  await fetchWithTrace(request);
  expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(
    'Bearer request'
  );
  await fetchWithTrace(request, {
    headers: { Authorization: 'Bearer override' },
    redirect: 'follow'
  });
  expect(fetch.mock.calls[1][1].headers.get('Authorization')).toBe(
    'Bearer override'
  );
  expect(fetch.mock.calls[1][1].redirect).toBe('error');
  expect(request.headers.has('X-Trace-Id')).toBe(false);
});

it.each([
  'https://tiles.example.org/1/2/3.png',
  'https://ai.example.org/documents/analyze',
  'https://api.example.org.evil.test/api/v1/account',
  'https://api.example.org@evil.test/api/v1/account',
  'https://api.example.org:444/api/v1/account',
  'http://api.example.org/api/v1/account',
  '/lang/en.json'
])('leaves unrelated requests unchanged (%s)', async url => {
  const options = {
    headers: { Accept: 'application/json' },
    redirect: 'follow'
  };
  await fetchWithTrace(url, options);
  expect(fetch).toHaveBeenCalledExactlyOnceWith(url, options);
  expect(fetch.mock.calls[0][1]).toBe(options);
});

it('resolves relative API URLs against the page origin', async () => {
  apiConfig.API_URL = window.location.origin;
  await fetchWithTrace('/api/v1/account');
  expect(fetch.mock.calls[0][1].headers.get('X-Trace-Id')).toBe(
    getSessionTraceId()
  );
});

it('does not inject tracing when no API is configured', async () => {
  apiConfig.API_URL = undefined;
  await fetchWithTrace('/api/v1/account');
  expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/v1/account', undefined);
});

it.each([401, 429, 503])(
  'returns HTTP %i without parsing or retrying',
  async status => {
    const response = new Response('<html>error</html>', { status });
    fetch.mockResolvedValue(response);
    await expect(
      fetchWithTrace('https://api.example.org/api/v1/account')
    ).resolves.toBe(response);
    expect(response.bodyUsed).toBe(false);
    expect(fetch).toHaveBeenCalledOnce();
  }
);

it('preserves network and cancellation errors', async () => {
  const error = new DOMException('Aborted', 'AbortError');
  fetch.mockRejectedValue(error);
  await expect(
    fetchWithTrace('https://api.example.org/api/v1/account')
  ).rejects.toBe(error);
});
