import { runInNewContext } from 'node:vm';
import { mapRateLimitPlugin } from './mapRateLimitPlugin.mjs';

it.each([null, '120', 'Wed, 25 Nov 2026 12:00:00 GMT'])(
  'reports a background 429 with raw Retry-After %s only to its requesting page',
  async retryAfter => {
    const postMessage = vi.fn();
    const get = vi.fn().mockResolvedValue({ postMessage });
    // Workbox serializes callbacks without access to module bindings.
    const fetchDidSucceed = runInNewContext(
      `(${mapRateLimitPlugin.fetchDidSucceed.toString()})`,
      { globalThis: { clients: { get } } }
    );
    const response = new Response(null, {
      status: 429,
      headers: retryAfter === null ? {} : { 'Retry-After': retryAfter }
    });
    const request = new Request('https://api.test/');
    expect(
      await fetchDidSucceed({ response, request, event: { clientId: 'page' } })
    ).toBe(response);
    expect(get).toHaveBeenCalledExactlyOnceWith('page');
    expect(postMessage).toHaveBeenCalledExactlyOnceWith({
      type: 'grottocenter-map-rate-limit',
      retryAfter,
      isAuthenticated: false
    });
  }
);

it('preserves the 429 if its requesting page has already closed', async () => {
  const get = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('clients', { get });
  try {
    const response = new Response(null, { status: 429 });
    expect(
      await mapRateLimitPlugin.fetchDidSucceed({
        response,
        request: new Request('https://api.test/'),
        event: { clientId: 'closed-page' }
      })
    ).toBe(response);
  } finally {
    vi.unstubAllGlobals();
  }
});
