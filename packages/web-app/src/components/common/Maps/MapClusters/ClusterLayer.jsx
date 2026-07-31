import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useMap, useMapEvent } from 'react-leaflet';
import * as L from 'leaflet';
import { GlobalStyles } from '@mui/material';
import useCluster from './useCluster';

// Bubble size buckets (px diameter). Chosen so labels fit and the visual
// hierarchy small<medium<large<xl reads at a glance without a legend.
const SIZE_BUCKETS = [
  { max: 10, size: 30 },
  { max: 100, size: 40 },
  { max: 1000, size: 52 },
  { max: Infinity, size: 66 }
];

const sizeForCount = count =>
  SIZE_BUCKETS.find(b => count < b.max).size;

// Per-type pixel offset applied to the bubble via CSS translate. Nudges the
// three layers apart at the same geo point so users see three distinct
// bubbles instead of one perfectly-stacked pile.
const TYPE_OFFSET = {
  entrance: [0, 0],
  network: [14, -10],
  massif: [-14, -10]
};

// Standalone stylesheet — mounted once by the first ClusterLayer via
// GlobalStyles and shared by all three type variants. Colors are keyed off a
// data-type attribute so a single CSS block covers entrance/network/massif.
export const ClusterGlobalCss = (
  <GlobalStyles
    styles={`
      .cluster-bubble {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: #fff;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.85);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        transition: transform 120ms ease-out;
      }
      .cluster-bubble:hover {
        transform: scale(1.08);
      }
      .cluster-bubble[data-type="entrance"] { background: rgba(139, 69, 19, 0.85); }
      .cluster-bubble[data-type="network"]  { background: rgba(25, 118, 210, 0.85); }
      .cluster-bubble[data-type="massif"]   { background: rgba(56, 142, 60, 0.85); }
      .cluster-bubble:hover { filter: brightness(1.15); }
    `}
  />
);

const formatCount = count => {
  if (count < 1000) return String(count);
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.round(count / 1000)}k`;
};

// Build an L.divIcon for one bubble. The size determines both the CSS class
// and the iconSize/iconAnchor so Leaflet positions the marker by its center.
// A per-type CSS translate offsets the bubble away from the geo point so the
// three layers don't perfectly stack. Leaves (isolated points) render the
// same as clusters with count=1 so users always see a labeled, clickable dot.
const buildIcon = (count, type) => {
  const diameter = sizeForCount(count);
  const [ox, oy] = TYPE_OFFSET[type] || [0, 0];
  const style = `width:${diameter}px;height:${diameter}px;transform:translate(${ox}px,${oy}px);`;
  return L.divIcon({
    html: `<div class="cluster-bubble" data-type="${type}" style="${style}">${formatCount(count)}</div>`,
    className: '',
    iconSize: [diameter, diameter],
    iconAnchor: [diameter / 2, diameter / 2]
  });
};

/**
 * Renders a supercluster index as L.divIcon bubbles. Feed it a stable
 * [[lng,lat], ...] array; on each map move/zoom the visible clusters are
 * diff-applied against the previous set so unchanged bubbles are reused
 * (no marker churn, no visual flicker).
 *
 * Clicking a cluster flies the map to `getClusterExpansionZoom(id)`, the
 * zoom at which that cluster splits into sub-clusters or leaves.
 */
const ClusterLayer = ({ data, type, enabled = true, pane = null, onLeafClick = null }) => {
  const map = useMap();
  const supercluster = useCluster(data);
  // key ("c:<id>" | "l:<pointId>") → L.Marker, for O(1) diff
  const markersRef = useRef(new Map());

  const refresh = useCallback(() => {
    const currentMap = markersRef.current;

    if (!enabled || !supercluster) {
      for (const m of currentMap.values()) m.remove();
      currentMap.clear();
      return;
    }

    const bounds = map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];
    const zoom = Math.round(map.getZoom());
    const clusters = supercluster.getClusters(bbox, zoom);

    const nextKeys = new Set();
    for (const feature of clusters) {
      const { cluster: isCluster, cluster_id: clusterId, point_count: count } =
        feature.properties;
      const displayCount = isCluster ? count : 1;
      const key = isCluster ? `c:${clusterId}` : `l:${feature.properties.pointId}`;
      nextKeys.add(key);

      const [lng, lat] = feature.geometry.coordinates;

      const existing = currentMap.get(key);
      if (existing) {
        // For clusters, count can change even with same id when neighbours
        // shift — update icon in place rather than recreating the marker.
        if (isCluster && existing._count !== count) {
          existing.setIcon(buildIcon(count, type));
          existing._count = count;
        }
        continue;
      }

      const markerOptions = {
        icon: buildIcon(displayCount, type),
        zIndexOffset: 0,
        interactive: true
      };
      // Only set `pane` when explicitly provided — passing `pane: undefined`
      // would override Leaflet's default (markerPane) and crash _initIcon
      // when getPane(undefined) returns nothing.
      if (pane) markerOptions.pane = pane;
      const marker = L.marker([lat, lng], markerOptions);
      marker._count = displayCount;

      marker.on('click', () => {
        if (isCluster) {
          // getClusterExpansionZoom returns the exact zoom where this cluster
          // splits — often just +1/+2. Boost it so a click feels like a real
          // "dive in" (min +3 vs current, +2 vs raw expansion), capped by the
          // map's max zoom.
          const expansion = supercluster.getClusterExpansionZoom(clusterId);
          const targetZoom = Math.min(
            map.getMaxZoom(),
            Math.max(expansion + 2, map.getZoom() + 3)
          );
          map.flyTo([lat, lng], targetZoom, { duration: 0.6 });
          return;
        }
        // Single isolated point: caller can override, otherwise we zoom in
        // several levels so the real marker layer (if any) takes over.
        if (onLeafClick) {
          onLeafClick(feature.properties.pointId, [lng, lat]);
          return;
        }
        const targetZoom = Math.min(map.getMaxZoom(), map.getZoom() + 4);
        map.flyTo([lat, lng], targetZoom, { duration: 0.6 });
      });

      marker.addTo(map);
      currentMap.set(key, marker);
    }

    // Remove markers no longer visible
    for (const [key, marker] of currentMap) {
      if (!nextKeys.has(key)) {
        marker.remove();
        currentMap.delete(key);
      }
    }
  }, [map, supercluster, enabled, type, pane, onLeafClick]);

  // Re-query on map movement and whenever data/enabled changes.
  useMapEvent('moveend', refresh);
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cleanup all markers on unmount
  useEffect(() => {
    const currentMarkers = markersRef.current;
    return () => {
      for (const m of currentMarkers.values()) m.remove();
      currentMarkers.clear();
    };
  }, []);

  return null;
};

ClusterLayer.propTypes = {
  data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  type: PropTypes.oneOf(['entrance', 'network', 'massif']).isRequired,
  enabled: PropTypes.bool,
  pane: PropTypes.string,
  onLeafClick: PropTypes.func
};

export default ClusterLayer;
