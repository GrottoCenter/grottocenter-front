import { runInNewContext } from 'node:vm';
import { mapRateLimitPlugin } from './mapRateLimitPlugin.mjs';

let worker;
let plugin;
let postMessage;
const NOW = Date.UTC(2026, 10, 23, 12);

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  postMessage = vi.fn();
  worker = { clients: { matchAll: async () => [{ postMessage }] } };
  // Exercise serialized callbacks with no access to module bindings.
  plugin = Object.fromEntries(
    Object.entries(mapRateLimitPlugin).map(([key, callback]) => [
      key,
      runInNewContext(`(${callback.toString()})`, { globalThis: worker, Date })
    ])
  );
});

afterEach(() => vi.restoreAllMocks());

it.each([
  ['120', 120000, true],
  [new Date(NOW + 90000).toUTCString(), 90000, true],
  ['0', 1000, true],
  ['600', 600000, true],
  [null, 600000, false],
  ['invalid', 600000, false],
  ['-1', 600000, false]
])(
  'announces Retry-After %s and blocks new worker requests',
  async (value, delay, hasServerDeadline) => {
    const response = new Response(null, {
      status: 429,
      headers: value === null ? {} : { 'Retry-After': value }
    });
    expect(await plugin.fetchDidSucceed({ response })).toBe(response);
    expect(postMessage).toHaveBeenCalledWith({
      type: 'grottocenter-map-rate-limit',
      retryAt: NOW + delay,
      hasServerDeadline
    });
    const otherRoute = { ...plugin };
    await expect(
      otherRoute.requestWillFetch({ request: new Request('https://api.test/') })
    ).rejects.toThrow('Map rate limit');

    worker.grottocenterMapRateLimit.retryAt = Date.now() - 1;
    const request = new Request('https://api.test/');
    expect(await otherRoute.requestWillFetch({ request })).toBe(request);
  }
);

it('shares fallback parsing and never shortens an in-flight cooldown', async () => {
  await plugin.fetchDidSucceed({
    response: new Response(null, { status: 429 })
  });
  const previous = worker.grottocenterMapRateLimit;
  expect(previous.hasServerDeadline).toBe(false);
  await plugin.fetchDidSucceed({
    response: new Response(null, {
      status: 429,
      headers: { 'Retry-After': '5' }
    })
  });
  expect(worker.grottocenterMapRateLimit).toBe(previous);
  await plugin.fetchDidSucceed({ response: new Response('[]') });
  expect(worker.grottocenterMapRateLimit).toBe(previous);
});
