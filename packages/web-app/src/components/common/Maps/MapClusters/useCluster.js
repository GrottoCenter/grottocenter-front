import { useMemo } from 'react';
import Supercluster from 'supercluster';

// Cluster radius in pixels — the smaller, the more granular the split at any
// given zoom. 100 keeps bubbles well spaced so labels stay legible and the
// three-type overlap on the global map doesn't cascade into unreadable stacks.
const DEFAULT_RADIUS = 100;
// Above MAX_ZOOM supercluster returns individual points as leaves. We stop
// clustering above the marker threshold (13) because at that zoom the tile-
// cached marker layer takes over with real popup-capable markers.
const DEFAULT_MAX_ZOOM = 16;

/**
 * Build a Supercluster index for a set of [lng, lat] tuples. The index is
 * memoized on the data array reference — since the bulk coordinate fetches
 * are one-shot per page load, the index is only built once per type.
 *
 * Returns null while data is missing (empty array is a valid, harmless index).
 */
const useCluster = (data, { radius = DEFAULT_RADIUS, maxZoom = DEFAULT_MAX_ZOOM } = {}) =>
  useMemo(() => {
    if (!Array.isArray(data)) return null;
    const index = new Supercluster({ radius, maxZoom });
    const points = new Array(data.length);
    for (let i = 0; i < data.length; i += 1) {
      const [lng, lat] = data[i];
      points[i] = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { pointId: i }
      };
    }
    index.load(points);
    return index;
  }, [data, radius, maxZoom]);

export default useCluster;
