import { useMapEvent } from 'react-leaflet';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { isNil } from 'ramda';
import * as d3 from 'd3';
import * as L from 'leaflet';
import 'd3-hexbin';
// after L import
import '@asymmetrik/leaflet-d3';
import { GlobalStyles } from '@mui/material';
import { useIntl } from 'react-intl';
import { heatmapTypes } from './DataControl';
import {
  MARKERS_LIMIT,
  ENTRANCE_HEAT_COLORS,
  NETWORK_HEAT_COLORS,
  HEX_FLY_TO_DURATION,
  HEX_RADIUS_RANGE,
  HEX_LAYER_OPTIONS,
  HEX_DETAILS_RADIUS_RANGE,
  HEX_DETAILS_ZOOM,
  HEX_DETAILS_OPACITY,
  HEX_OPACITY
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

const useHeatLayer = (data = [], type = heatmapTypes.ENTRANCES) => {
  const { formatMessage } = useIntl();
  const [hexLayer, setHexLayer] = useState();
  const isDraggingRef = useRef(false);
  // Pending requestAnimationFrame id - coalesces rapid .data() calls into one frame.
  const rafRef = useRef(null);
  const dragEndTimerRef = useRef(null);
  // Skip colorRange + hoverHandler re-registration when the type hasn't changed.
  const lastTypeRef = useRef(null);

  // On zoom lvl, hex opacity and size can change
  const map = useMapEvent('zoomend', () => {
    // Hide any visible tooltip - the hovered hex may disappear mid-zoom
    // leaving no mouseout to clean it up. We hide rather than remove so the
    // div stays alive in the hoverHandler's closure and can be reused on next hover.
    d3.selectAll('.hexbin-tooltip').style('visibility', 'hidden');

    if (!isNil(hexLayer)) {
      if (map.getZoom() > HEX_DETAILS_ZOOM) {
        hexLayer
          .radiusRange(HEX_DETAILS_RADIUS_RANGE)
          .opacity(HEX_DETAILS_OPACITY);
      } else {
        hexLayer.radiusRange(HEX_RADIUS_RANGE).opacity(HEX_OPACITY);
      }
    }
  });

  // Reset type cache when the hexLayer is (re)initialized.
  useEffect(() => {
    lastTypeRef.current = null;
  }, [hexLayer]);

  const updateHeatData = useCallback(
    (newData, newType = type) => {
      if (isNil(hexLayer)) return;

      // colorRange and hoverHandler only need updating when the type switches.
      // Skipping the D3 event re-registration on every pan saves work.
      if (newType !== lastTypeRef.current) {
        // Remove previous tooltip (avoid some bug)
        d3.selectAll('.hexbin-tooltip').remove();
        hexLayer
          .colorRange(
            newType === heatmapTypes.NETWORKS
              ? NETWORK_HEAT_COLORS
              : ENTRANCE_HEAT_COLORS
          )
          .hoverHandler(
            L.HexbinHoverHandler.compound({
              handlers: [
                L.HexbinHoverHandler.resizeFill(),
                L.HexbinHoverHandler.tooltip({
                  tooltipContent: nbr =>
                    `${nbr.length} ${formatMessage({ id: newType })}`
                })
              ]
            })
          );
        lastTypeRef.current = newType;
      }

      // Coalesce rapid calls into a single frame - cancels any pending RAF
      // so only the latest data update is rendered, without blocking the current frame.
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        hexLayer.data(newData);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hexLayer]
  );

  useMapEvent('dragstart', () => {
    isDraggingRef.current = true;
  });

  useMapEvent('dragend', () => {
    // Defer reset past the click event that may fire synchronously on the
    // mouseup/touchend that ends the drag, preventing a spurious flyTo.
    dragEndTimerRef.current = setTimeout(() => {
      dragEndTimerRef.current = null;
      isDraggingRef.current = false;
    }, 0);
  });

  const flyToHex = (_, hexPoints) => {
    if (isDraggingRef.current) return;

    d3.selectAll('.hexbin-tooltip').attr('opacity', 0);
    const bounds = new L.LatLngBounds(
      hexPoints.map(point => [point.o[1], point.o[0]])
    );
    map.flyToBounds(bounds, {
      maxZoom: MARKERS_LIMIT,
      duration: HEX_FLY_TO_DURATION
    });
  };

  useEffect(() => {
    // Add hex layer to the map
    setHexLayer(L.hexbinLayer(HEX_LAYER_OPTIONS).addTo(map));
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (dragEndTimerRef.current) clearTimeout(dragEndTimerRef.current);
      // Remove tooltip
      d3.selectAll('.hexbin-tooltip').remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isNil(hexLayer)) {
      // Initialize Hex scaling with sqrt to amplify differences at low densities
      hexLayer.colorScale(d3.scaleSqrt());

      hexLayer
        .radiusRange(HEX_RADIUS_RANGE)
        .lng(d => d[0])
        .lat(d => d[1])
        .colorValue(d => d.length)
        .radiusValue(d => d.length);

      hexLayer.dispatch().on('click', flyToHex);

      updateHeatData(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hexLayer]);

  return {
    updateHeatData
  };
};

export default useHeatLayer;
