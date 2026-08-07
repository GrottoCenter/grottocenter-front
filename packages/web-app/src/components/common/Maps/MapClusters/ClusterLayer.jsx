import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
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

const sizeForCount = count => SIZE_BUCKETS.find(b => count < b.max).size;

// Per-type pixel offset applied to the bubble via CSS translate. Nudges the
// layers apart at the same geo point so users see distinct bubbles instead of
// one perfectly-stacked pile. Kept small so a cluster's center stays visually
// tied to its geographic anchor.
const TYPE_OFFSET = {
  network: [14, -10],
  massif: [-14, -10],
  organization: [0, 14]
};

// Standalone stylesheet — mounted once by the first ClusterLayer via
// GlobalStyles and shared by all type variants. Each type has both a distinct
// color AND a distinct shape so the map remains readable for users with color
// vision deficiencies (WCAG 1.4.1 — never rely on color alone).
export const ClusterGlobalCss = (
  <GlobalStyles
    styles={`
      .cluster-bubble {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        box-sizing: border-box;
        transition: transform 120ms ease-out, filter 120ms ease-out;
      }
      /* Entrance — circle */
      .cluster-bubble[data-type="entrance"] {
        background: rgba(139, 69, 19, 0.85);
        border: 2px solid rgba(255, 255, 255, 0.85);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        border-radius: 50%;
      }
      /* Organization — rounded square. Amber like the organization SVG marker
         (MUI amber[500]); dark text for legibility since amber is too light
         for white labels. */
      .cluster-bubble[data-type="organization"] {
        background: rgba(255, 193, 7, 0.9);
        color: #3E2723;
        border: 2px solid rgba(255, 255, 255, 0.85);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        border-radius: 22%;
      }
      /* Massif — rounded diamond. Achieved by rotating a rounded square 45°.
         scale(0.88) gives the diamond a diagonal of ~1.25×D so its visible
         AREA matches a circle of diameter D (a rotated square only fills
         50% of its bounding box, vs ~78% for a circle — so matching bounding
         boxes would leave the diamond looking undersized). Slight overflow
         beyond the icon bounding box is fine; TYPE_OFFSET keeps stacked
         layers from colliding. Label is counter-rotated to read upright. */
      .cluster-bubble[data-type="massif"] {
        background: rgba(56, 142, 60, 0.85);
        border: 2px solid rgba(255, 255, 255, 0.85);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        border-radius: 22%;
        transform: rotate(45deg) scale(0.88);
      }
      .cluster-bubble[data-type="massif"] .cluster-bubble-label {
        display: inline-block;
        transform: rotate(-45deg);
      }
      /* Network — regular flat-top hexagon. Rendered via inline SVG rather
         than clip-path so we can draw a real white stroke (clip-path would
         eat the border). Vertices at y=6.7% / 93.3% keep the sides equal
         (regular hexagon fits a rect of ratio 2:√3, so it can't fill both
         dimensions of a square). vector-effect keeps the stroke at 2 CSS
         pixels regardless of the bubble's diameter. */
      .cluster-bubble[data-type="network"] {
        background: transparent;
        position: relative;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.25));
      }
      .cluster-bubble[data-type="network"] .cluster-bubble-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
      }
      .cluster-bubble[data-type="network"] .cluster-bubble-label {
        position: relative;
        z-index: 1;
      }

      .cluster-bubble[data-type="entrance"]:hover,
      .cluster-bubble[data-type="organization"]:hover {
        transform: scale(1.08);
        filter: brightness(1.15);
      }
      .cluster-bubble[data-type="massif"]:hover {
        transform: rotate(45deg) scale(0.95);
        filter: brightness(1.15);
      }
      .cluster-bubble[data-type="network"]:hover {
        transform: scale(1.08);
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.25)) brightness(1.15);
      }
    `}
  />
);

const formatCount = count => {
  if (count < 1000) return String(count);
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.round(count / 1000)}k`;
};

// Regular flat-top hexagon inscribed in a 100×100 viewBox. Sides all equal
// 50 units (see CSS comment for the geometric derivation).
const NETWORK_HEX_SVG =
  '<svg class="cluster-bubble-svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
  '<polygon points="25,6.7 75,6.7 100,50 75,93.3 25,93.3 0,50" ' +
  'fill="rgba(25,118,210,0.85)" ' +
  'stroke="rgba(255,255,255,0.85)" ' +
  'stroke-width="2" ' +
  'vector-effect="non-scaling-stroke" ' +
  'stroke-linejoin="round" />' +
  '</svg>';

// Build an L.divIcon for one bubble. The per-type offset (used to nudge
// stacked layers apart at the same geo point) is baked into iconAnchor
// rather than an inline transform, keeping the CSS transform slot free for
// per-type shape rotations (see the massif rotated-diamond rule). The label
// is wrapped in a span so it can be counter-rotated inside a rotated shape.
// Network uses an inline SVG hexagon (see NETWORK_HEX_SVG) because clip-path
// can't render a stroke; all other types get shape via CSS on the div itself.
// Leaves (isolated points) render the same as clusters with count=1 so users
// always see a labeled, clickable dot.
const buildIcon = (count, type) => {
  const diameter = sizeForCount(count);
  const [ox, oy] = TYPE_OFFSET[type] || [0, 0];
  const label = `<span class="cluster-bubble-label">${formatCount(count)}</span>`;
  const inner = type === 'network' ? `${NETWORK_HEX_SVG}${label}` : label;
  return L.divIcon({
    html: `<div class="cluster-bubble" data-type="${type}" style="width:${diameter}px;height:${diameter}px;">${inner}</div>`,
    className: '',
    iconSize: [diameter, diameter],
    iconAnchor: [diameter / 2 - ox, diameter / 2 - oy]
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
 *
 * Note: `onLeafClick` is part of the `refresh` callback's dependency array,
 * so callers should memoize it (useCallback) to avoid rebuilding every
 * cluster marker on each parent render.
 */
const ClusterLayer = ({
  data = [],
  type,
  enabled = true,
  pane = null,
  onLeafClick = null
}) => {
  const map = useMap();
  // Build the supercluster kd-tree as soon as data arrives, not on `enabled`.
  // The entrance layer (default on, ~130k points) toggles `enabled` on every
  // zoom-in/out through MARKERS_LIMIT; gating the index on `enabled` would
  // rebuild that kd-tree synchronously during render on each zoom-out,
  // freezing the UI for hundreds of ms.
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
      const {
        cluster: isCluster,
        cluster_id: clusterId,
        point_count: count
      } = feature.properties;
      const displayCount = isCluster ? count : 1;
      const key = isCluster
        ? `c:${clusterId}`
        : `l:${feature.properties.pointId}`;
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
        // Every branch below moves the view, so release the location control's
        // follow — it would otherwise recenter on the user right after.
        map.fire('followdetach');
        if (isCluster) {
          // getClusterExpansionZoom returns the exact zoom where this cluster
          // splits — often just +1/+2. Boost it so a click feels like a real
          // "dive in" (min +3 vs current, +2 vs raw expansion), capped by the
          // map's max zoom. Intentional: from just under MARKERS_LIMIT the +3
          // floor jumps straight past the threshold into real-marker territory
          // — a click on a cluster should always resolve it, never re-cluster.
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

  // Re-query on map movement and whenever data/enabled changes. refresh()
  // reads markersRef.current synchronously inside its own body, so calling it
  // directly here (rather than capturing the ref like the cleanup effect
  // below) is safe — every dependency change does trigger a full marker
  // rebuild, but enabled=false short-circuits immediately.
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
  data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  type: PropTypes.oneOf(['entrance', 'network', 'massif', 'organization'])
    .isRequired,
  enabled: PropTypes.bool,
  pane: PropTypes.string,
  // Part of the `refresh` callback's dependency array — callers must memoize
  // this (useCallback) to avoid rebuilding every cluster marker on each
  // parent render.
  onLeafClick: PropTypes.func
};

export default ClusterLayer;
