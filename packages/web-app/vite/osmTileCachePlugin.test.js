import { runInNewContext } from 'node:vm';
import { osmTileCachePlugin } from './osmTileCachePlugin.mjs';

// Run the serialized callbacks without module bindings, as the generated SW does.
const plugin = Object.fromEntries(
  Object.entries(osmTileCachePlugin).map(([name, callback]) => [
    name,
    runInNewContext(`(${callback.toString()})`, {
      globalThis: { Response }
    })
  ])
);
const requestFor = mode =>
  new Request('https://tile.openstreetmap.org/9/262/183.png', { mode });

it('ignores an opaque Leaflet cache entry when PDF export requests CORS', async () => {
  // Opaque responses cannot be constructed by script; only fetch creates them.
  const cachedResponse = { type: 'opaque' };
  expect(
    await plugin.cachedResponseWillBeUsed({
      request: requestFor('cors'),
      cachedResponse
    })
  ).toBeNull();
});

it('preserves opaque cached tiles for Leaflet offline use', async () => {
  const cachedResponse = { type: 'opaque' };
  expect(
    await plugin.cachedResponseWillBeUsed({
      request: requestFor('no-cors'),
      cachedResponse
    })
  ).toBe(cachedResponse);
});

it.each(['cors', 'no-cors'])(
  'reuses a readable cached tile for a %s request',
  async mode => {
    const cachedResponse = { type: 'cors' };
    expect(
      await plugin.cachedResponseWillBeUsed({
        request: requestFor(mode),
        cachedResponse
      })
    ).toBe(cachedResponse);
  }
);

it('keeps a cache miss as a miss', async () => {
  expect(
    await plugin.cachedResponseWillBeUsed({ request: requestFor('cors') })
  ).toBeUndefined();
});

it('lets failed PDF tile downloads reject instead of returning an SVG', async () => {
  expect(
    await plugin.handlerDidError({ request: requestFor('cors') })
  ).toBeNull();
});

it('keeps the offline SVG placeholder for Leaflet images', async () => {
  const response = await plugin.handlerDidError({
    request: requestFor('no-cors')
  });
  expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  expect(await response.text()).toContain('<svg');
});
