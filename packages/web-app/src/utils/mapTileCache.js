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
      emitScheduled: false
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

// Bounds-based inclusion (not tile-based) so entities on tile edges aren't
// duplicated or missed. Handles anti-meridian wrap.
const withinBounds = (lat, lng, b) => {
  if (lat < b.sw_lat || lat > b.ne_lat) return false;
  if (b.ne_lng >= b.sw_lng) return lng >= b.sw_lng && lng <= b.ne_lng;
  return lng >= b.sw_lng || lng <= b.ne_lng;
};

const computeUnion = entity => {
  const s = state[entity];
  if (!s || !s.lastBounds) return [];
  const seen = new Set();
  const out = [];
  s.tiles.forEach(rec => {
    if (!rec.data) return;
    for (let i = 0; i < rec.data.length; i += 1) {
      const item = rec.data[i];
      if (item == null || seen.has(item.id)) continue;
      if (withinBounds(item.latitude, item.longitude, s.lastBounds)) {
        seen.add(item.id);
        out.push(item);
      }
    }
  });
  return out;
};

// Coalesce multiple in-flight tile completions into a single dispatch per
// microtask, snapshotting lastBounds at emit time so late responses from a
// stale viewport don't overwrite fresh data (they still populate the cache).
const scheduleEmit = entity => {
  const s = state[entity];
  if (!s || s.emitScheduled) return;
  s.emitScheduled = true;
  queueMicrotask(() => {
    s.emitScheduled = false;
    if (!s.dispatch || !s.config) return;
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
      evictIfNeeded(s.tiles);
      scheduleEmit(entity);
      return data;
    })
    .catch(error => {
      s.dispatch?.({
        type: s.config.failureType,
        error: makeErrorMessage(error.message, `Fetching ${s.config.label}`)
      });
      throw error;
    })
    .finally(() => {
      const rec = s.tiles.get(key);
      if (rec && rec.inFlight === promise) delete rec.inFlight;
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
    const age = rec ? t - rec.fetchedAt : Infinity;
    // MISSING (no record OR fetchedAt=0 from invalidation) or STALE (>= FRESH_MS)
    if (!rec || rec.fetchedAt === 0 || age >= FRESH_MS) {
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
