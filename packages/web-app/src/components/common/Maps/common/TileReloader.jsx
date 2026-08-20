import { useCallback } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useRefetchOnReconnect } from '../../../../hooks';

// Re-request the basemap tiles that couldn't load while offline.
//
// Nothing else does it, and no amount of panning will: Leaflet stamps
// `tile.loaded` in `_tileReady()` even when the request errored, so a tile is
// only ever fetched once per layer lifetime. Offline it's worse still — the
// service worker answers missing OSM/OpenTopoMap tiles with a placeholder image
// (see vite.config.mjs, runtimeCaching), so Leaflet sees a *success* and doesn't
// even fire `tileerror`. Either way the grey placeholders would stay for the
// rest of the session once the connection is back.
//
// redraw() drops every tile and re-requests the visible ones. Applied to all
// GridLayers rather than the active basemap only, so overlays (WMS/WMTS) recover
// too. Cheap and idempotent: online, the tiles come straight back from the
// service worker cache.
//
// Must be rendered as a direct child of <MapContainer> so `useMap` resolves.
const TileReloader = () => {
  const map = useMap();
  const redrawTiles = useCallback(() => {
    map.eachLayer(layer => {
      if (layer instanceof L.GridLayer) layer.redraw();
    });
  }, [map]);
  useRefetchOnReconnect(redrawTiles);
  return null;
};

export default TileReloader;
