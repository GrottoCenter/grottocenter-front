import fc from 'fast-check';
import {
  latLngToTile,
  tileToBounds,
  tilesForBounds,
  tileKey
} from './tileMath';

// Web Mercator's latitude domain, matching the constant in tileMath.js.
const MAX_LAT = 85.0511287798;

describe('latLngToTile', () => {
  it('returns tile 0/0/0 at zoom 0 for any input', () => {
    expect(latLngToTile(0, 0, 0)).toEqual({ x: 0, y: 0, z: 0 });
    expect(latLngToTile(45, -100, 0)).toEqual({ x: 0, y: 0, z: 0 });
    expect(latLngToTile(-45, 179, 0)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('splits the world into 4 tiles at zoom 1', () => {
    // (0, 0) sits on the SE corner of tile (0,0); floor puts it into (1,1).
    expect(latLngToTile(0.1, -0.1, 1)).toEqual({ x: 0, y: 0, z: 1 });
    expect(latLngToTile(0.1, 0.1, 1)).toEqual({ x: 1, y: 0, z: 1 });
    expect(latLngToTile(-0.1, -0.1, 1)).toEqual({ x: 0, y: 1, z: 1 });
    expect(latLngToTile(-0.1, 0.1, 1)).toEqual({ x: 1, y: 1, z: 1 });
  });

  it('clamps longitude at ±180 to a valid tile index', () => {
    const z = 5;
    const n = 2 ** z;
    // At exactly +180, floor of n rounds to n, but the function clamps to n-1.
    const east = latLngToTile(0, 180, z);
    expect(east.x).toBe(n - 1);
    expect(east.x).toBeLessThan(n);
    const west = latLngToTile(0, -180, z);
    expect(west.x).toBe(0);
  });

  it('clamps latitude at the Web Mercator poles', () => {
    const z = 5;
    const n = 2 ** z;
    // Anything past MAX_LAT clamps back to the north-most Mercator tile.
    const north = latLngToTile(89, 0, z);
    const at = latLngToTile(MAX_LAT, 0, z);
    expect(north.y).toBe(at.y);
    expect(north.y).toBeGreaterThanOrEqual(0);
    expect(north.y).toBeLessThan(n);
    const south = latLngToTile(-89, 0, z);
    const atSouth = latLngToTile(-MAX_LAT, 0, z);
    expect(south.y).toBe(atSouth.y);
  });

  it('returns tiles within [0, n-1] for any valid lat/lng/zoom', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -89.9, max: 89.9, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        fc.integer({ min: 0, max: 18 }),
        (lat, lng, z) => {
          const t = latLngToTile(lat, lng, z);
          const n = 2 ** z;
          expect(t.z).toBe(z);
          expect(t.x).toBeGreaterThanOrEqual(0);
          expect(t.x).toBeLessThanOrEqual(n - 1);
          expect(t.y).toBeGreaterThanOrEqual(0);
          expect(t.y).toBeLessThanOrEqual(n - 1);
        }
      )
    );
  });
});

describe('tileToBounds', () => {
  it('covers the whole world at zoom 0', () => {
    const b = tileToBounds(0, 0, 0);
    expect(b.sw_lng).toBeCloseTo(-180, 6);
    expect(b.ne_lng).toBeCloseTo(180, 6);
    expect(b.ne_lat).toBeCloseTo(MAX_LAT, 4);
    expect(b.sw_lat).toBeCloseTo(-MAX_LAT, 4);
  });

  it('produces bounds where sw < ne on each axis', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 12 }), z => {
        const n = 2 ** z;
        const x = Math.min(n - 1, Math.floor(n / 3));
        const y = Math.min(n - 1, Math.floor(n / 3));
        const b = tileToBounds(x, y, z);
        expect(b.sw_lat).toBeLessThan(b.ne_lat);
        expect(b.sw_lng).toBeLessThan(b.ne_lng);
      })
    );
  });
});

describe('latLngToTile / tileToBounds round-trip', () => {
  it('tileToBounds(latLngToTile(lat, lng)) contains (lat, lng)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -MAX_LAT + 0.001, max: MAX_LAT - 0.001, noNaN: true }),
        fc.double({ min: -179.999, max: 179.999, noNaN: true }),
        fc.integer({ min: 0, max: 18 }),
        (lat, lng, z) => {
          const tile = latLngToTile(lat, lng, z);
          const b = tileToBounds(tile.x, tile.y, tile.z);
          // Bounds are half-open [sw, ne); allow a tiny epsilon for FP jitter.
          const eps = 1e-9;
          expect(lat).toBeGreaterThanOrEqual(b.sw_lat - eps);
          expect(lat).toBeLessThanOrEqual(b.ne_lat + eps);
          expect(lng).toBeGreaterThanOrEqual(b.sw_lng - eps);
          expect(lng).toBeLessThanOrEqual(b.ne_lng + eps);
        }
      )
    );
  });
});

describe('tilesForBounds', () => {
  it('returns exactly one tile when bounds fit inside a single tile', () => {
    const bounds = tileToBounds(5, 7, 4);
    // Nudge inward so any half-open edge doesn't spill into a neighbour.
    const midLat = (bounds.sw_lat + bounds.ne_lat) / 2;
    const midLng = (bounds.sw_lng + bounds.ne_lng) / 2;
    const eps = 1e-6;
    const tiles = tilesForBounds(
      {
        sw_lat: midLat - eps,
        ne_lat: midLat + eps,
        sw_lng: midLng - eps,
        ne_lng: midLng + eps
      },
      4
    );
    expect(tiles).toEqual([{ x: 5, y: 7, z: 4 }]);
  });

  it('covers the whole world at zoom 1', () => {
    const tiles = tilesForBounds(
      {
        sw_lat: -MAX_LAT + 0.1,
        sw_lng: -179.9,
        ne_lat: MAX_LAT - 0.1,
        ne_lng: 179.9
      },
      1
    );
    // 2x2 grid at zoom 1.
    expect(tiles).toHaveLength(4);
    const keys = new Set(tiles.map(t => `${t.x}:${t.y}`));
    expect(keys).toEqual(new Set(['0:0', '1:0', '0:1', '1:1']));
  });

  it('handles a viewport crossing the anti-meridian (two contiguous ranges)', () => {
    // Wrap: ne_lng < sw_lng means we cross ±180.
    const tiles = tilesForBounds(
      { sw_lat: -1, ne_lat: 1, sw_lng: 170, ne_lng: -170 },
      3
    );
    const n = 2 ** 3;
    const xs = new Set(tiles.map(t => t.x));
    // Must include both the far-east and the far-west columns.
    expect(xs.has(n - 1)).toBe(true);
    expect(xs.has(0)).toBe(true);
    // Every x is either near 0 (west range) or near n-1 (east range) — no
    // huge span across the middle.
    tiles.forEach(t => {
      expect(t.x === 0 || t.x === n - 1 || t.x <= 1 || t.x >= n - 2).toBe(true);
    });
  });

  it('returns tiles with the requested zoom', () => {
    const tiles = tilesForBounds(
      { sw_lat: -10, ne_lat: 10, sw_lng: -10, ne_lng: 10 },
      6
    );
    expect(tiles.length).toBeGreaterThan(0);
    tiles.forEach(t => expect(t.z).toBe(6));
  });
});

describe('tileKey', () => {
  it('joins entity, z, x, y with colons', () => {
    expect(tileKey('entrances', { x: 3, y: 5, z: 12 })).toBe(
      'entrances:12:3:5'
    );
  });

  it('is unique per (entity, tile) tuple', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('entrances', 'networks', 'organizations'),
        fc.integer({ min: 0, max: 18 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (entity, z, x, y) => {
          const a = tileKey(entity, { x, y, z });
          const b = tileKey(entity, { x: x + 1, y, z });
          expect(a).not.toBe(b);
        }
      )
    );
  });
});
