// Client-side LRU + TTL/SWR tile cache for the global map. Keyed by
// {entity, z, x, y} on a fixed slippy-map grid at CACHE_ZOOM. See
// utils/tileMath.js for the tile geometry.

import makeErrorMessage from '../helpers/makeErrorMessage';
import { makeUrl } from '../actions/utils';
import {
  latLngToTile,
  tileKey,
  tileToBounds,
  tilesForBounds
} from './tileMath';

export const CACHE_ZOOM = 12;
const FRESH_MS = 5 * 60 * 1000;
// How long a failed tile stays "cached as failed" before we allow another
// attempt. Prevents a moveend from re-firing the same tile that just failed.
const FAILURE_COOLDOWN_MS = 30 * 1000;
const MAX_TILES = 500;

const now = () => Date.now();

// entity → { tiles, lastBounds, config, dispatch }
// tiles is a JS Map<tileKey, { data, fetchedAt, inFlight? }>. Insertion
// order gives us free LRU: iterating tiles.keys() yields oldest first.
const state = {};

const ensureEntity = entity => {
  if (!state[entity]) {
    state[entity] = {
      tiles: new Map(),
      lastBounds: null,
      config: null,
      dispatch: null,
      emitScheduled: false,
      // Bumped every time a tile's data is set (fetch success or invalidation).
      // scheduleEmit uses this to skip dispatches when nothing has changed since
      // the last emit — the common case when panning within already-cached tiles.
      tilesVersion: 0,
      lastEmittedVersion: -1
    };
  }
  return state[entity];
};

const evictIfNeeded = tiles => {
  while (tiles.size > MAX_TILES) {
    const firstKey = tiles.keys().next().value;
    tiles.delete(firstKey);
  }
};

// Union of all cached tile data (deduped by id). No viewport-bounds filter:
// Leaflet's canvas renderer culls off-screen points on its own, and filtering
// here would make the union change on every pan — even one within already-
// cached tiles — forcing a Redux dispatch and a full marker-diff for nothing.
const computeUnion = entity => {
  const s = state[entity];
  if (!s) return [];
  const seen = new Set();
  const out = [];
  s.tiles.forEach(rec => {
    if (!rec.data) return;
    for (let i = 0; i < rec.data.length; i += 1) {
      const item = rec.data[i];
      if (item == null || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  });
  return out;
};

// Coalesce multiple in-flight tile completions into a single dispatch per
// microtask. Skips the dispatch entirely when no tile has completed since the
// last emit — this is what makes pans within already-cached tiles free
// (no Redux state change → no re-render → no marker diff → no canvas redraw).
const scheduleEmit = entity => {
  const s = state[entity];
  if (!s || s.emitScheduled) return;
  // Short-circuit when nothing has changed since the last emit — the common
  // case when panning within already-cached tiles. Avoids the queueMicrotask
  // + closure allocation per hot moveend.
  if (s.lastEmittedVersion === s.tilesVersion) return;
  s.emitScheduled = true;
  queueMicrotask(() => {
    s.emitScheduled = false;
    if (!s.dispatch || !s.config) return;
    if (s.lastEmittedVersion === s.tilesVersion) return;
    s.lastEmittedVersion = s.tilesVersion;
    s.dispatch({ type: s.config.successType, data: computeUnion(entity) });
  });
};

const fetchTile = (entity, tile, apiZoom) => {
  const s = state[entity];
  const key = tileKey(entity, tile);
  const existing = s.tiles.get(key);
  if (existing?.inFlight) return existing.inFlight;

  const bounds = tileToBounds(tile.x, tile.y, tile.z);
  const url = makeUrl(s.config.url, {
    sw_lat: bounds.sw_lat,
    sw_lng: bounds.sw_lng,
    ne_lat: bounds.ne_lat,
    ne_lng: bounds.ne_lng,
    zoom: apiZoom
  });

  const promise = fetch(url)
    .then(response => {
      if (response.status >= 400) throw new Error(response.status);
      return response.text();
    })
    .then(text => JSON.parse(text))
    .then(data => {
      s.tiles.set(key, { data, fetchedAt: now() });
      s.tilesVersion += 1;
      evictIfNeeded(s.tiles);
      scheduleEmit(entity);
      return data;
    })
    .catch(error => {
      // Preserve previously-cached data on failure (stale-while-error): a
      // transient network hiccup during background revalidation must not
      // blank out the user's view. `fetchedAt` is refreshed to `now()` so
      // FAILURE_COOLDOWN_MS actually gates the next retry attempt from the
      // moment of failure — otherwise a stale `fetchedAt` would trip the
      // cooldown immediately and moveend would spam refetches.
      const prev = s.tiles.get(key);
      s.tiles.set(key, {
        ...(prev?.data !== undefined ? { data: prev.data } : {}),
        fetchedAt: now(),
        failed: true
      });
      s.tilesVersion += 1;
      evictIfNeeded(s.tiles);
      s.dispatch?.({
        type: s.config.failureType,
        error: makeErrorMessage(error.message, `Fetching ${s.config.label}`)
      });
      throw error;
    });

  s.tiles.set(key, { ...(existing || {}), inFlight: promise });
  return promise;
};

export const registerEntity = (entity, config) => {
  ensureEntity(entity).config = config;
};

export const fetchForBounds = (entity, bounds, apiZoom, dispatch) => {
  const s = ensureEntity(entity);
  if (!s.config) {
    throw new Error(`mapTileCache: entity "${entity}" not registered`);
  }
  s.dispatch = dispatch;
  s.lastBounds = bounds;
  s.lastApiZoom = apiZoom;

  scheduleEmit(entity);

  const tiles = tilesForBounds(bounds, CACHE_ZOOM);
  const t = now();
  for (let i = 0; i < tiles.length; i += 1) {
    const tile = tiles[i];
    const rec = s.tiles.get(tileKey(entity, tile));
    // MISSING (no record OR fetchedAt=0 from invalidation).
    if (!rec || rec.fetchedAt === 0) {
      fetchTile(entity, tile, apiZoom).catch(() => {});
      continue;
    }
    // Failed tiles use a shorter cooldown so an outage recovers quickly,
    // successful tiles use the normal freshness TTL.
    const ttl = rec.failed ? FAILURE_COOLDOWN_MS : FRESH_MS;
    if (t - rec.fetchedAt >= ttl) {
      fetchTile(entity, tile, apiZoom).catch(() => {});
    }
  }
};

// Mark every tile of an entity as stale and refetch tiles overlapping the
// current viewport. Called from the invalidation middleware after a mutation.
export const invalidateAll = entity => {
  const s = state[entity];
  if (!s) return;
  s.tiles.forEach(rec => {
    rec.fetchedAt = 0;
  });
  if (s.lastBounds && s.dispatch && s.config) {
    fetchForBounds(entity, s.lastBounds, s.lastApiZoom, s.dispatch);
  }
};

// Mark the single tile that geographically contains (latitude, longitude)
// as stale and refetch it. Used by the invalidation middleware when the
// mutation payload carries coordinates — avoids the cost of a full-entity
// nuclear invalidation while still resyncing with the server (so we never
// hold a locally-injected shape that could drift from the /geoloc projection).
export const invalidateTileAt = (entity, latitude, longitude) => {
  const s = state[entity];
  if (!s || !s.config) return;
  if (latitude == null || longitude == null) return;
  const tile = latLngToTile(latitude, longitude, CACHE_ZOOM);
  const key = tileKey(entity, tile);
  const rec = s.tiles.get(key);
  if (rec) rec.fetchedAt = 0;
  if (s.lastBounds && s.dispatch) {
    fetchForBounds(entity, s.lastBounds, s.lastApiZoom, s.dispatch);
  }
};

// Test-only reset. Not exported through an index; internal use.
export const _resetForTests = () => {
  Object.keys(state).forEach(k => delete state[k]);
};
