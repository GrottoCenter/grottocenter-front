import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  registerEntity,
  fetchForBounds,
  invalidateAll,
  invalidateTileAt,
  _resetForTests,
  CACHE_ZOOM
} from './mapTileCache';
import { tileToBounds } from './tileMath';

const ENTITY = 'entrances';
const CONFIG = {
  url: '/api/entrances',
  label: 'entrances',
  successType: 'ENTRANCES_SUCCESS',
  failureType: 'ENTRANCES_FAILURE'
};

// Build viewport bounds that map to exactly one tile at CACHE_ZOOM so tests can
// control tile-count precisely without depending on the full slippy-map math.
const singleTileBounds = (x, y) => {
  const b = tileToBounds(x, y, CACHE_ZOOM);
  const midLat = (b.sw_lat + b.ne_lat) / 2;
  const midLng = (b.sw_lng + b.ne_lng) / 2;
  const eps = 1e-6;
  return {
    sw_lat: midLat - eps,
    ne_lat: midLat + eps,
    sw_lng: midLng - eps,
    ne_lng: midLng + eps
  };
};

// Resolve every microtask/promise scheduled up to now.
const flushPromises = () =>
  new Promise(r => {
    setTimeout(r, 0);
  });

describe('mapTileCache', () => {
  let fetchMock;
  let dispatch;

  beforeEach(() => {
    _resetForTests();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    dispatch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete global.fetch;
  });

  const fetchOk = data =>
    Promise.resolve({
      status: 200,
      text: () => Promise.resolve(JSON.stringify(data))
    });

  const fetchFail = status =>
    Promise.resolve({
      status,
      text: () => Promise.resolve('')
    });

  describe('computeUnion dedup', () => {
    it('dedupes items with the same id across tiles', async () => {
      registerEntity(ENTITY, CONFIG);
      // Two adjacent tiles each carrying an overlapping id.
      fetchMock
        .mockReturnValueOnce(
          fetchOk([
            { id: 1, name: 'A' },
            { id: 2, name: 'B' }
          ])
        )
        .mockReturnValueOnce(
          fetchOk([
            { id: 2, name: 'B' },
            { id: 3, name: 'C' }
          ])
        );

      // Bounds spanning two adjacent tiles horizontally at CACHE_ZOOM.
      const left = tileToBounds(100, 100, CACHE_ZOOM);
      const right = tileToBounds(101, 100, CACHE_ZOOM);
      const bounds = {
        sw_lat: (left.sw_lat + left.ne_lat) / 2 - 1e-6,
        ne_lat: (left.sw_lat + left.ne_lat) / 2 + 1e-6,
        sw_lng: left.sw_lng + 1e-6,
        ne_lng: right.ne_lng - 1e-6
      };
      fetchForBounds(ENTITY, bounds, CACHE_ZOOM, dispatch);
      await flushPromises();

      const successCalls = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.successType
      );
      const finalData = successCalls[successCalls.length - 1][0].data;
      const ids = finalData.map(x => x.id).sort();
      expect(ids).toEqual([1, 2, 3]);
    });

    it('keeps id-less items (does not collide on undefined)', async () => {
      registerEntity(ENTITY, CONFIG);
      // Two id-less items in the same tile — both must appear in the union.
      fetchMock.mockReturnValueOnce(
        fetchOk([{ name: 'no-id-1' }, { name: 'no-id-2' }])
      );

      fetchForBounds(ENTITY, singleTileBounds(200, 200), CACHE_ZOOM, dispatch);
      await flushPromises();

      const successCalls = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.successType
      );
      const finalData = successCalls[successCalls.length - 1][0].data;
      expect(finalData).toHaveLength(2);
    });

    it('skips null items inside tile data', async () => {
      registerEntity(ENTITY, CONFIG);
      fetchMock.mockReturnValueOnce(
        fetchOk([null, { id: 1 }, null, { id: 2 }])
      );

      fetchForBounds(ENTITY, singleTileBounds(210, 210), CACHE_ZOOM, dispatch);
      await flushPromises();

      const successCalls = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.successType
      );
      const finalData = successCalls[successCalls.length - 1][0].data;
      expect(finalData.map(x => x.id).sort()).toEqual([1, 2]);
    });
  });

  describe('scheduleEmit version gate', () => {
    it('dispatches once up-front on the initial fetchForBounds (even empty)', async () => {
      registerEntity(ENTITY, CONFIG);
      fetchMock.mockReturnValueOnce(fetchOk([{ id: 1 }]));

      fetchForBounds(ENTITY, singleTileBounds(220, 220), CACHE_ZOOM, dispatch);
      await flushPromises();

      const successCalls = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.successType
      );
      // At minimum the tile-arrival dispatch fires; the initial pre-fetch
      // dispatch is version-gated and only lands when the version differs
      // from lastEmittedVersion (true on first ever call → 1 dispatch).
      expect(successCalls.length).toBeGreaterThanOrEqual(1);
      expect(successCalls[successCalls.length - 1][0].data).toEqual([
        { id: 1 }
      ]);
    });

    it('does not re-dispatch when panning within already-cached tiles', async () => {
      registerEntity(ENTITY, CONFIG);
      fetchMock.mockReturnValueOnce(fetchOk([{ id: 42 }]));

      // First pass: warm the cache.
      fetchForBounds(ENTITY, singleTileBounds(230, 230), CACHE_ZOOM, dispatch);
      await flushPromises();

      const before = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.successType
      ).length;

      // Second pass: same tile, still fresh → no new fetch, no dispatch.
      fetchForBounds(ENTITY, singleTileBounds(230, 230), CACHE_ZOOM, dispatch);
      await flushPromises();

      const after = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.successType
      ).length;
      expect(after).toBe(before);
      // And no additional fetch was issued.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchTile inFlight dedup', () => {
    it('does not spawn duplicate requests for the same tile', async () => {
      registerEntity(ENTITY, CONFIG);
      // Slow-resolving fetch — never lets go until we tell it to.
      let resolveFetch;
      fetchMock.mockImplementation(
        () =>
          new Promise(res => {
            resolveFetch = () =>
              res({ status: 200, text: () => Promise.resolve('[]') });
          })
      );

      // Two back-to-back calls before the first resolves.
      fetchForBounds(ENTITY, singleTileBounds(240, 240), CACHE_ZOOM, dispatch);
      fetchForBounds(ENTITY, singleTileBounds(240, 240), CACHE_ZOOM, dispatch);
      await Promise.resolve();

      expect(fetchMock).toHaveBeenCalledTimes(1);

      resolveFetch();
      await flushPromises();
    });
  });

  describe('failure handling', () => {
    it('dispatches failure and keeps a subsequent call gated by the cooldown', async () => {
      registerEntity(ENTITY, CONFIG);
      fetchMock.mockReturnValueOnce(fetchFail(500));

      fetchForBounds(ENTITY, singleTileBounds(250, 250), CACHE_ZOOM, dispatch);
      await flushPromises();

      const failureCalls = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.failureType
      );
      expect(failureCalls.length).toBe(1);

      // Second call immediately after — cooldown must gate a retry, no new fetch.
      fetchForBounds(ENTITY, singleTileBounds(250, 250), CACHE_ZOOM, dispatch);
      await flushPromises();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('preserves previous data on a subsequent failure (stale-while-error)', async () => {
      registerEntity(ENTITY, CONFIG);
      fetchMock.mockReturnValueOnce(fetchOk([{ id: 7, name: 'kept' }]));

      // Success first — populate the cache.
      fetchForBounds(ENTITY, singleTileBounds(260, 260), CACHE_ZOOM, dispatch);
      await flushPromises();

      // Force the TTL to expire so the next call actually re-fetches.
      const spy = vi
        .spyOn(Date, 'now')
        .mockReturnValue(Date.now() + 10 * 60 * 1000);
      fetchMock.mockReturnValueOnce(fetchFail(500));

      fetchForBounds(ENTITY, singleTileBounds(260, 260), CACHE_ZOOM, dispatch);
      await flushPromises();

      spy.mockRestore();

      // The union should still contain the previous data despite the failed refetch.
      const successCalls = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.successType
      );
      const lastData = successCalls[successCalls.length - 1][0].data;
      expect(lastData).toEqual([{ id: 7, name: 'kept' }]);
    });
  });

  describe('invalidateAll', () => {
    it('marks tiles stale and triggers a refetch', async () => {
      registerEntity(ENTITY, CONFIG);
      fetchMock.mockReturnValueOnce(fetchOk([{ id: 1 }]));

      fetchForBounds(ENTITY, singleTileBounds(270, 270), CACHE_ZOOM, dispatch);
      await flushPromises();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Invalidation should re-issue a fetch for the same tile immediately.
      fetchMock.mockReturnValueOnce(fetchOk([{ id: 1 }, { id: 2 }]));
      invalidateAll(ENTITY);
      await flushPromises();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const successCalls = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.successType
      );
      const finalData = successCalls[successCalls.length - 1][0].data;
      expect(finalData.map(x => x.id).sort()).toEqual([1, 2]);
    });

    it('no-ops if no bounds have been recorded yet', () => {
      registerEntity(ENTITY, CONFIG);
      // No prior fetchForBounds: lastBounds is null, so nothing should fire.
      invalidateAll(ENTITY);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('invalidateTileAt', () => {
    it('only refetches when the invalidated tile intersects the current bounds', async () => {
      registerEntity(ENTITY, CONFIG);
      const near = tileToBounds(300, 300, CACHE_ZOOM);
      const boundsNear = {
        sw_lat: (near.sw_lat + near.ne_lat) / 2 - 1e-6,
        ne_lat: (near.sw_lat + near.ne_lat) / 2 + 1e-6,
        sw_lng: (near.sw_lng + near.ne_lng) / 2 - 1e-6,
        ne_lng: (near.sw_lng + near.ne_lng) / 2 + 1e-6
      };

      fetchMock.mockReturnValueOnce(fetchOk([{ id: 1 }]));
      fetchForBounds(ENTITY, boundsNear, CACHE_ZOOM, dispatch);
      await flushPromises();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Invalidating a point INSIDE the current viewport → refetch the affected tile.
      const midLat = (near.sw_lat + near.ne_lat) / 2;
      const midLng = (near.sw_lng + near.ne_lng) / 2;
      fetchMock.mockReturnValueOnce(fetchOk([{ id: 1 }, { id: 9 }]));
      invalidateTileAt(ENTITY, midLat, midLng);
      await flushPromises();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('is a no-op when coordinates are missing', () => {
      registerEntity(ENTITY, CONFIG);
      invalidateTileAt(ENTITY, null, null);
      invalidateTileAt(ENTITY, undefined, undefined);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('eviction during an in-flight fetch', () => {
    it('re-caches the tile on completion instead of throwing or dropping data', async () => {
      registerEntity(ENTITY, CONFIG);

      // Tile A: kick off a fetch and keep it pending so it stays the oldest
      // (and therefore first-evicted) entry while everything else lands.
      let resolveA;
      fetchMock.mockImplementationOnce(
        () =>
          new Promise(res => {
            resolveA = () =>
              res({
                status: 200,
                text: () => Promise.resolve(JSON.stringify([{ id: 'A' }]))
              });
          })
      );
      fetchMock.mockImplementation(() => fetchOk([]));

      fetchForBounds(ENTITY, singleTileBounds(0, 0), CACHE_ZOOM, dispatch);

      // Fill the cache past MAX_TILES (500) with distinct tiles so
      // evictIfNeeded kicks tile A's still-in-flight record out of the map
      // before its fetch settles.
      for (let x = 1; x <= 500; x += 1) {
        fetchForBounds(ENTITY, singleTileBounds(x, 0), CACHE_ZOOM, dispatch);
      }
      await flushPromises();

      // Now let tile A's fetch resolve. clearInFlight() must no-op on the
      // already-evicted record instead of throwing, and the success handler
      // must re-insert tile A's data rather than silently dropping it.
      resolveA();
      await flushPromises();

      const successCalls = dispatch.mock.calls.filter(
        ([a]) => a.type === CONFIG.successType
      );
      const finalData = successCalls[successCalls.length - 1][0].data;
      expect(finalData.some(item => item.id === 'A')).toBe(true);
    });
  });

  describe('registerEntity guard', () => {
    it('throws when fetchForBounds is called before registerEntity', () => {
      expect(() =>
        fetchForBounds(
          'never-registered',
          singleTileBounds(0, 0),
          CACHE_ZOOM,
          dispatch
        )
      ).toThrow(/not registered/);
    });
  });
});
