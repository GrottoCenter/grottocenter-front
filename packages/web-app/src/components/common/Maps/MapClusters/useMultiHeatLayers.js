import { useMapEvent } from 'react-leaflet';
import { useCallback, useEffect, useRef } from 'react';
import { isNil } from 'ramda';
import * as d3 from 'd3';
import * as L from 'leaflet';
import 'd3-hexbin';
import '@asymmetrik/leaflet-d3';
import { useIntl } from 'react-intl';
import { heatmapTypes } from './DataControl';
import {
  MARKERS_LIMIT,
  ENTRANCE_HEAT_COLORS,
  NETWORK_HEAT_COLORS,
  MASSIF_HEAT_COLORS,
  HEX_FLY_TO_DURATION,
  HEX_RADIUS_RANGE,
  HEX_DETAILS_RADIUS_RANGE,
  HEX_DETAILS_ZOOM,
  HEX_DETAILS_OPACITY,
  HEX_OPACITY,
  HEX_MAX_RADIUS
} from './constants';

const COLOR_MAP = {
  [heatmapTypes.ENTRANCES]: ENTRANCE_HEAT_COLORS,
  [heatmapTypes.NETWORKS]: NETWORK_HEAT_COLORS,
  [heatmapTypes.MASSIFS]: MASSIF_HEAT_COLORS
};

// Pixel offsets applied to each layer's SVG container via CSS transform.
// Half a hex radius (~7px) in different directions so grids don't overlap.
const HALF_HEX = HEX_MAX_RADIUS / 2;
const LAYER_SVG_OFFSETS = {
  [heatmapTypes.ENTRANCES]: [0, 0],
  [heatmapTypes.NETWORKS]: [HALF_HEX, HALF_HEX * 0.75],
  [heatmapTypes.MASSIFS]: [-HALF_HEX, HALF_HEX * 0.75]
};

// Apply a pixel-space translate on the layer's inner SVG <g> so the hex grid
// is visually shifted without rebinning points into the same grid cells.
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

const MULTI_OPACITY = 0.45;
const SINGLE_OPACITY = HEX_OPACITY;

const LAYER_TYPES = [
  heatmapTypes.ENTRANCES,
  heatmapTypes.NETWORKS,
  heatmapTypes.MASSIFS
];

/**
 * POC 3 — Multiple independent hexbin layers with opacity + offset.
 *
 * Creates one L.hexbinLayer per type (entrances, networks, massifs).
 * When multiple are active, each gets reduced opacity and a slight
 * coordinate offset so hexagons don't perfectly overlap.
 */
const useMultiHeatLayers = (heatOffZoom = MARKERS_LIMIT) => {
  const { formatMessage } = useIntl();
  const map = useMapEvent('zoomend', () => {
    d3.selectAll('.hexbin-tooltip').style('visibility', 'hidden');
    const zoom = map.getZoom();
    const shouldOffset = activeTypesRef.current.length > 1;

    LAYER_TYPES.forEach(type => {
      const layer = layersRef.current[type];
      if (isNil(layer)) return;

      if (zoom >= heatOffZoom) {
        layer.data([]);
        return;
      }
      if (zoom > HEX_DETAILS_ZOOM) {
        layer.radiusRange(HEX_DETAILS_RADIUS_RANGE).opacity(HEX_DETAILS_OPACITY);
      } else {
        const activeCount = activeTypesRef.current.length;
        const op = activeCount > 1 ? MULTI_OPACITY : SINGLE_OPACITY;
        layer.radiusRange(HEX_RADIUS_RANGE).opacity(op);
      }
      applyLayerOffset(layer, type, shouldOffset);
    });
  });

  const layersRef = useRef({});
  const activeTypesRef = useRef([]);
  const isDraggingRef = useRef(false);
  const rafRefs = useRef({});
  const dragEndTimerRef = useRef(null);

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

  // Create all three hex layers once on mount
  useEffect(() => {
    LAYER_TYPES.forEach(type => {
      const layer = L.hexbinLayer({
        radius: HEX_MAX_RADIUS,
        opacity: SINGLE_OPACITY,
        duration: 400
      }).addTo(map);

      layer.colorScale(d3.scaleSqrt());
      layer
        .radiusRange(HEX_RADIUS_RANGE)
        .lng(d => d[0])
        .lat(d => d[1])
        .colorValue(d => d.length)
        .radiusValue(d => d.length)
        .colorRange(COLOR_MAP[type]);

      layer.hoverHandler(
        L.HexbinHoverHandler.compound({
          handlers: [
            L.HexbinHoverHandler.resizeFill(),
            L.HexbinHoverHandler.tooltip({
              tooltipContent: nbr =>
                `${nbr.length} ${formatMessage({ id: type })}`
            })
          ]
        })
      );

      layer.dispatch().on('click', flyToHex);
      // Start hidden
      layer.data([]);
      layersRef.current[type] = layer;
    });

    return () => {
      LAYER_TYPES.forEach(type => {
        if (rafRefs.current[type]) cancelAnimationFrame(rafRefs.current[type]);
        const layer = layersRef.current[type];
        if (layer) {
          layer.data([]);
          map.removeLayer(layer);
        }
      });
      if (dragEndTimerRef.current) clearTimeout(dragEndTimerRef.current);
      d3.selectAll('.hexbin-tooltip').remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapEvent('dragstart', () => {
    isDraggingRef.current = true;
  });

  useMapEvent('dragend', () => {
    dragEndTimerRef.current = setTimeout(() => {
      dragEndTimerRef.current = null;
      isDraggingRef.current = false;
    }, 0);
  });

  /**
   * Update which layers are visible and feed them data.
   * @param {Object} dataByType - e.g. { entrances: [[lng,lat],...], networks: [...] }
   * @param {string[]} activeTypes - e.g. ['entrances', 'networks']
   */
  const updateLayers = useCallback((dataByType, activeTypes) => {
    activeTypesRef.current = activeTypes;
    const opacity = activeTypes.length > 1 ? MULTI_OPACITY : SINGLE_OPACITY;
    const shouldOffset = activeTypes.length > 1;

    LAYER_TYPES.forEach(type => {
      const layer = layersRef.current[type];
      if (isNil(layer)) return;

      const isActive = activeTypes.includes(type);
      const data = isActive ? (dataByType[type] || []) : [];

      layer.opacity(opacity);
      applyLayerOffset(layer, type, shouldOffset);

      if (!data || data.length === 0) {
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
        // Re-apply offset after redraw since data() triggers a full redraw
        applyLayerOffset(layer, type, shouldOffset);
      });
    });
  }, []);

  return { updateLayers };
};

export default useMultiHeatLayers;
