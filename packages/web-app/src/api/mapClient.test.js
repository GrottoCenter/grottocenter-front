import { mapFetch, isMapRateLimited, _resetForTests } from './mapClient';

const NOW = Date.UTC(2026, 10, 23, 12);
let clock;
let fetchMock;

beforeEach(() => {
  _resetForTests();
  clock = vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  _resetForTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  ['120', 120000],
  [new Date(NOW + 90000).toUTCString(), 90000],
  ['0', 1000],
  [new Date(NOW - 1000).toUTCString(), 1000],
  [null, 600000],
  ['', 600000],
  ['invalid', 600000],
  ['-1', 600000]
])('pauses all map endpoints for Retry-After %s', async (value, delay) => {
  const response = new Response('Too many requests', {
    status: 429,
    headers: value === null ? {} : { 'Retry-After': value }
  });
  fetchMock.mockResolvedValueOnce(response);
  fetchMock.mockResolvedValue(new Response('[]'));

  expect(await mapFetch('/api/v1/geoloc/entrances')).toBe(response);
  expect(response.bodyUsed).toBe(false);
  clock.mockReturnValue(NOW + delay - 1);
  await expect(mapFetch('/api/v1/geoloc/massifs')).rejects.toMatchObject({
    message: '429',
    status: 429
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);

  clock.mockReturnValue(NOW + delay);
  await mapFetch('/api/v1/geoloc/massifs');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(isMapRateLimited()).toBe(false);
});

it.each([200, 503])('does not pause the map on HTTP %i', async status => {
  fetchMock.mockResolvedValue(new Response('[]', { status }));
  await mapFetch('/api/v1/geoloc/entrances');
  await mapFetch('/api/v1/geoloc/networks');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(isMapRateLimited()).toBe(false);
});

it('keeps offline cache access available without lifting the online pause', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
  await mapFetch('/api/v1/geoloc/entrances');

  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const cached = new Response('[]');
  fetchMock.mockResolvedValueOnce(cached);
  expect(await mapFetch('/api/v1/geoloc/entrances')).toBe(cached);

  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await expect(mapFetch('/api/v1/geoloc/networks')).rejects.toMatchObject({
    status: 429
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it.each([200, 429])(
  'does not shorten a pause when an in-flight request returns HTTP %i',
  async status => {
    let finish;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const pending = mapFetch('/api/v1/geoloc/networks');
    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { 'Retry-After': '120' } })
    );
    await mapFetch('/api/v1/geoloc/entrances');
    finish(new Response(null, { status, headers: { 'Retry-After': '1' } }));
    await pending;
    clock.mockReturnValue(NOW + 30000);
    expect(isMapRateLimited()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  }
);
