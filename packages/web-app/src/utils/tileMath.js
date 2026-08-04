// Slippy-map tile helpers (OpenStreetMap Z/X/Y scheme) used by the map tile
// cache. See https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames

import { clamp } from 'ramda';

// Web Mercator's latitude domain, matching Leaflet's default projection.
const MAX_LAT = 85.0511287798;

export const latLngToTile = (lat, lng, z) => {
  const n = 2 ** z;
  const clampedLat = clamp(-MAX_LAT, MAX_LAT, lat);
  const latRad = (clampedLat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x: clamp(0, n - 1, x), y: clamp(0, n - 1, y), z };
};

export const tileToBounds = (x, y, z) => {
  const n = 2 ** z;
  const lngW = (x / n) * 360 - 180;
  const lngE = ((x + 1) / n) * 360 - 180;
  const latN =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const latS =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return { sw_lat: latS, sw_lng: lngW, ne_lat: latN, ne_lng: lngE };
};

// Return every tile (at zoom `z`) that intersects the given bounds.
// Handles anti-meridian wrap when ne_lng < sw_lng (viewport crosses ±180).
export const tilesForBounds = (bounds, z) => {
  const n = 2 ** z;
  const { sw_lat, sw_lng, ne_lat, ne_lng } = bounds;
  const nw = latLngToTile(ne_lat, sw_lng, z);
  const se = latLngToTile(sw_lat, ne_lng, z);
  const yMin = nw.y;
  const yMax = se.y;
  const xMinWest = nw.x;
  const xMaxEast = se.x;

  const tiles = [];
  const pushRange = (xFrom, xTo) => {
    for (let x = xFrom; x <= xTo; x += 1) {
      for (let y = yMin; y <= yMax; y += 1) {
        tiles.push({ x, y, z });
      }
    }
  };

  if (ne_lng >= sw_lng) {
    pushRange(xMinWest, xMaxEast);
  } else {
    // Viewport crosses the anti-meridian: two contiguous ranges.
    pushRange(xMinWest, n - 1);
    pushRange(0, xMaxEast);
  }
  return tiles;
};

export const tileKey = (entity, tile) =>
  `${entity}:${tile.z}:${tile.x}:${tile.y}`;
