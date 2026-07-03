import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { polygonHull } from 'd3-polygon';
import {
  NETWORK_HULL_STYLE,
  NETWORK_SPOKE_STYLE,
  NETWORK_ENTRANCE_HALO_STYLE,
  NETWORK_ENTRANCE_GHOST_STYLE
} from './constants';

const hasCoords = e =>
  typeof e?.latitude === 'number' && typeof e?.longitude === 'number';

// Draws a temporary overlay linking a network to its entrances:
// a convex-hull footprint, spokes from the centroid to each entrance,
// and ghost markers for the entrances. Rendered on demand (hover/tap) so
// it works even when the entrances layer is toggled off, without cluttering
// the map at rest.
const useNetworkHighlight = () => {
  const map = useMap();
  const layerRef = useRef(null);

  const getLayer = useCallback(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    return layerRef.current;
  }, [map]);

  const hideHighlight = useCallback(() => {
    if (layerRef.current) layerRef.current.clearLayers();
  }, []);

  const showHighlight = useCallback(
    network => {
      const layer = getLayer();
      layer.clearLayers();

      const entrances = (network?.entrances ?? []).filter(hasCoords);
      if (entrances.length === 0) return;

      const center = [network.latitude, network.longitude];

      // Convex hull needs at least 3 points. d3 works on planar [x, y];
      // lng/lat is fine here since we only need the enclosing shape.
      if (entrances.length >= 3) {
        const hull = polygonHull(entrances.map(e => [e.longitude, e.latitude]));
        if (hull) {
          L.polygon(
            hull.map(([lng, lat]) => [lat, lng]),
            NETWORK_HULL_STYLE
          ).addTo(layer);
        }
      }

      // Draw in z-order (later = on top): spokes, then entrance halos, then
      // the solid cores, so the highlighted entrances always sit above the lines.
      entrances.forEach(e => {
        L.polyline(
          [center, [e.latitude, e.longitude]],
          NETWORK_SPOKE_STYLE
        ).addTo(layer);
      });
      entrances.forEach(e => {
        L.circleMarker(
          [e.latitude, e.longitude],
          NETWORK_ENTRANCE_HALO_STYLE
        ).addTo(layer);
      });
      entrances.forEach(e => {
        L.circleMarker(
          [e.latitude, e.longitude],
          NETWORK_ENTRANCE_GHOST_STYLE
        ).addTo(layer);
      });
    },
    [getLayer]
  );

  useEffect(
    () => () => {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
    },
    []
  );

  return { showHighlight, hideHighlight };
};

export default useNetworkHighlight;
