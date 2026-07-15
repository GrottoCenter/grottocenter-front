import { useMapEvent } from 'react-leaflet';
import React, { useCallback, useEffect, useRef } from 'react';
import { isNil } from 'ramda';
import * as d3 from 'd3';
// Default import (not `* as L`) so that @asymmetrik/leaflet-d3 augments the
// same mutable object — the ESM namespace is frozen and L.hexbinLayer would
// never appear on it in the production Rolldown build.
import L from 'leaflet';
import 'd3-hexbin';
import '@asymmetrik/leaflet-d3';
import { GlobalStyles } from '@mui/material';
import { useIntl } from 'react-intl';
import { heatmapTypes } from './DataControl';
import {
  MARKERS_LIMIT,
  ENTRANCE_HEAT_COLORS,
  NETWORK_HEAT_COLORS,
  MASSIF_HEAT_COLORS,
  HEX_FLY_TO_DURATION,
  HEX_RADIUS_RANGE,
  HEX_LAYER_OPTIONS,
  HEX_DETAILS_RADIUS_RANGE,
  HEX_DETAILS_ZOOM,
  HEX_DETAILS_OPACITY,
  HEX_OPACITY,
  HEX_MAX_RADIUS,
  getHeatOffZoom
} from './constants';

export const HexGlobalCss = (
  <GlobalStyles
    styles="
& .hexbin-grid {
  cursor: pointer;
}
& .hexbin-hexagon {
  stroke: #000;
  stroke-width: .5px;
  }
  & .hexbin-container:hover .hexbin-hexagon {
 transition: 200ms;
 stroke-width: 1.5px;
 stroke-opacity: 1;
 }
 & .hexbin-tooltip {
  padding: 8px;
  background: #616161e6;
  color: white;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 400;
 }"
  />
);

// For more customization see https://github.com/Asymmetrik/leaflet-d3 documentation

const COLOR_MAP = {
  [heatmapTypes.ENTRANCES]: ENTRANCE_HEAT_COLORS,
  [heatmapTypes.NETWORKS]: NETWORK_HEAT_COLORS,
  [heatmapTypes.MASSIFS]: MASSIF_HEAT_COLORS
};

// Pixel-space SVG offsets so hex grids from different types don't perfectly overlap.
// Half a hex radius in different directions — tune HEX_MAX_RADIUS / 2.
const HALF_HEX = HEX_MAX_RADIUS / 2;
const LAYER_SVG_OFFSETS = {
  [heatmapTypes.ENTRANCES]: [0, 0],
  [heatmapTypes.NETWORKS]: [HALF_HEX, HALF_HEX * 0.75],
  [heatmapTypes.MASSIFS]: [-HALF_HEX, HALF_HEX * 0.75]
};

// Apply (or clear) a pixel-space translate on the layer's inner SVG <g>.
// This shifts the rendered grid without rebinning points geographically.
const applyLayerOffset = (layer, type, shouldOffset) => {
  if (!layer?._container) return;
  const g = layer._container.querySelector('g');
  if (!g) return;
  if (shouldOffset) {
    const [dx, dy] = LAYER_SVG_OFFSETS[type];
    g.style.transform = `translate(${dx}px, ${dy}px)`;
  } else {
    g.style.transform = '';
  }
};

// Pane config — massifs gets the lowest z-index so it always renders below entrances/networks.
// z-indexes between Leaflet's overlay pane (400) and shadow pane (500).
const LAYER_PANE_CONFIG = [
  { type: heatmapTypes.MASSIFS, pane: 'hex-massifs', z: 420 },
  { type: heatmapTypes.ENTRANCES, pane: 'hex-entrances', z: 425 },
  { type: heatmapTypes.NETWORKS, pane: 'hex-networks', z: 430 }
];

const LAYER_TYPES = LAYER_PANE_CONFIG.map(c => c.type);

/**
 * Manages three independent hexbin layers (massifs below, then entrances, then networks).
 * When multiple layers are active, each layer gets a slight pixel-space SVG offset
 * so hexagons from different types don't perfectly overlap.
 * Each layer uses its own zoom threshold (massifs: 8, entrances/networks: 13).
 */
const useHeatLayer = () => {
  const { formatMessage } = useIntl();
  // Ref so the tooltip closure always reads the current locale without re-creating layers.
  const formatMessageRef = useRef(formatMessage);
  formatMessageRef.current = formatMessage;
  const layersRef = useRef({});
  const activeTypesRef = useRef([]);
  const isDraggingRef = useRef(false);
  const rafRefs = useRef({});
  const dragEndTimerRef = useRef(null);

  const map = useMapEvent('zoomend', () => {
    // Hide any visible tooltip — the hovered hex may disappear mid-zoom,
    // leaving no mouseout to clean it up.
    d3.selectAll('.hexbin-tooltip').style('visibility', 'hidden');

    const zoom = map.getZoom();
    const shouldOffset = activeTypesRef.current.length > 1;

    LAYER_TYPES.forEach(type => {
      const layer = layersRef.current[type];
      if (isNil(layer)) return;

      if (zoom >= getHeatOffZoom(type)) {
        // Above the threshold: synchronously clear to prevent stale hexagons
        // reappearing before any RAF-scheduled data update.
        if (rafRefs.current[type]) {
          cancelAnimationFrame(rafRefs.current[type]);
          rafRefs.current[type] = null;
        }
        layer.data([]);
        return;
      }

      if (zoom > HEX_DETAILS_ZOOM) {
        layer.radiusRange(HEX_DETAILS_RADIUS_RANGE).opacity(HEX_DETAILS_OPACITY);
      } else {
        layer.radiusRange(HEX_RADIUS_RANGE).opacity(HEX_OPACITY);
      }
      applyLayerOffset(layer, type, shouldOffset);
    });
  });

  const flyToHex = useCallback(
    (_, hexPoints) => {
      if (isDraggingRef.current) return;
      d3.selectAll('.hexbin-tooltip').attr('opacity', 0);
      const bounds = new L.LatLngBounds(
        hexPoints.map(point => [point.o[1], point.o[0]])
      );
      map.flyToBounds(bounds, {
        maxZoom: MARKERS_LIMIT,
        duration: HEX_FLY_TO_DURATION
      });
    },
    [map]
  );

  // Create all three hex layers once on mount.
  // Panes are created first so each layer's SVG lands in its own pane with a fixed z-index,
  // guaranteeing massifs always renders below entrances and networks regardless of redraw order.
  useEffect(() => {
    LAYER_PANE_CONFIG.forEach(({ pane, z }) => {
      if (!map.getPane(pane)) map.createPane(pane).style.zIndex = z;
    });

    LAYER_PANE_CONFIG.forEach(({ type, pane }) => {
      const layer = L.hexbinLayer({ ...HEX_LAYER_OPTIONS, pane }).addTo(map);

      layer.colorScale(d3.scaleSqrt());
      layer
        .radiusRange(HEX_RADIUS_RANGE)
        .lng(d => d[0])
        .lat(d => d[1])
        .colorValue(d => d.length)
        .radiusValue(d => d.length)
        .colorRange(COLOR_MAP[type])
        .hoverHandler(
          L.HexbinHoverHandler.compound({
            handlers: [
              L.HexbinHoverHandler.resizeFill(),
              L.HexbinHoverHandler.tooltip({
                tooltipContent: nbr =>
                  `${nbr.length} ${formatMessageRef.current({ id: type })}`
              })
            ]
          })
        );

      // flyToHex is stable (useCallback with [map], and map never changes in Leaflet),
      // so registering it once at mount is safe — no need to re-register on re-renders.
      layer.dispatch().on('click', flyToHex);
      layer.data([]);
      layersRef.current[type] = layer;
    });

    // Capture refs now — not DOM nodes so their values won't be nulled by React,
    // but capturing satisfies the react-hooks/exhaustive-deps lint rule.
    const rafs = rafRefs.current;
    const layers = layersRef.current;
    const dragTimer = dragEndTimerRef;
    return () => {
      LAYER_TYPES.forEach(type => {
        if (rafs[type]) cancelAnimationFrame(rafs[type]);
        if (layers[type]) {
          layers[type].data([]);
          map.removeLayer(layers[type]);
        }
      });
      if (dragTimer.current) clearTimeout(dragTimer.current);
      d3.selectAll('.hexbin-tooltip').remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapEvent('dragstart', () => {
    isDraggingRef.current = true;
  });

  useMapEvent('dragend', () => {
    // Defer reset past the click event that fires on the mouseup ending the drag.
    dragEndTimerRef.current = setTimeout(() => {
      dragEndTimerRef.current = null;
      isDraggingRef.current = false;
    }, 0);
  });

  /**
   * Update which layers are visible and feed them data.
   * @param {{ entrances, networks, massifs }} dataByType - arrays of [lng, lat] tuples
   * @param {string[]} activeTypes - which types are currently active
   */
  // Empty deps: this callback only reads refs (layersRef, activeTypesRef, rafRefs),
  // which are always up-to-date. No need to list them as dependencies.
  const updateLayers = useCallback((dataByType, activeTypes) => {
    activeTypesRef.current = activeTypes;
    const shouldOffset = activeTypes.length > 1;

    LAYER_TYPES.forEach(type => {
      const layer = layersRef.current[type];
      if (isNil(layer)) return;

      const data = activeTypes.includes(type) ? (dataByType[type] || []) : [];

      layer.opacity(HEX_OPACITY);

      if (data.length === 0) {
        if (rafRefs.current[type]) {
          cancelAnimationFrame(rafRefs.current[type]);
          rafRefs.current[type] = null;
        }
        layer.data([]);
        return;
      }

      if (rafRefs.current[type]) cancelAnimationFrame(rafRefs.current[type]);
      rafRefs.current[type] = requestAnimationFrame(() => {
        rafRefs.current[type] = null;
        layer.data(data);
        // Re-apply offset after data() triggers a full redraw.
        applyLayerOffset(layer, type, shouldOffset);
      });
    });
  }, []);

  return { updateLayers };
};

export default useHeatLayer;
