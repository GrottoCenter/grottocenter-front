import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
import { mapDetailCacheKey } from './mapDetailCacheKey.mjs';

// Exercise the serialized hook, as Workbox does, without module bindings.
const cacheKey = runInNewContext(`(${mapDetailCacheKey.toString()})`, {
  globalThis: { URL, crypto: webcrypto, TextEncoder }
});
const keyFor = (path, token, prefix = '') =>
  cacheKey({
    request: new Request(`https://api.example.org${prefix}/api/v1/${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
  });

it.each(
  ['entrances/1', 'caves/2', 'massifs/3', 'organizations/4'].flatMap(path =>
    ['', '/grottocenter', '/proxy/grottocenter'].map(prefix => [path, prefix])
  )
)(
  'isolates %s under prefix "%s" by session without exposing the bearer',
  async (path, prefix) => {
    const anonymous = await keyFor(path, null, prefix);
    const alice = await keyFor(path, 'alice-token', prefix);
    const bob = await keyFor(path, 'bob-token', prefix);
    expect(new Set([anonymous, alice, bob]).size).toBe(3);
    expect(alice).toBe(await keyFor(path, 'alice-token', prefix));
    expect(alice).not.toContain('alice-token');
    expect(anonymous).toContain('__gc_session=anonymous');
    expect(anonymous).not.toBe(
      `https://api.example.org${prefix}/api/v1/${path}`
    );
  }
);

it.each([
  'geoloc/entrances?zoom=13',
  'geoloc/entrancesCoordinates',
  'massifs/3/statistics',
  'languages'
])('leaves the cache key for %s unchanged', async path => {
  expect(await keyFor(path, 'alice-token')).toBe(
    `https://api.example.org/api/v1/${path}`
  );
});
