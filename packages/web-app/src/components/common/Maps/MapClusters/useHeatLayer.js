import { useMapEvent } from 'react-leaflet';
import { useCallback, useEffect, useState, useRef } from 'react';
import { isNil } from 'ramda';
import * as d3 from 'd3';
import * as L from 'leaflet';
import 'd3-hexbin';
// after L import
import '@asymmetrik/leaflet-d3';
import { createGlobalStyle } from 'styled-components';
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

export const HexGlobalCss = createGlobalStyle`
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
  }
`;

// For more customization see https://github.com/Asymmetrik/leaflet-d3 documentation

const useHeatLayer = (data = [], type = heatmapTypes.ENTRANCES) => {
  const { formatMessage } = useIntl();
  const [hexLayer, setHexLayer] = useState();
  const lastMoveEndTs = useRef(0);

  // On zoom lvl, hex opacity and size can change
  const map = useMapEvent('zoomend', () => {
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

  const updateHeatData = useCallback(
    (newData, newType = type) => {
      if (!isNil(hexLayer)) {
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
          )
          .data(newData);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hexLayer]
  );

  useMapEvent('moveend', () => {
    lastMoveEndTs.current = Date.now();
  });

  const flyToHex = (_, hexPoints) => {
    const timeSinceMapMoveMs = Date.now() - lastMoveEndTs.current;
    if (timeSinceMapMoveMs < 20) return; // Prevent drag click

    d3.selectAll('.hexbin-tooltip').attr('opacity', 0);
    const bounds = new L.LatLngBounds(
      hexPoints.map(point => point.o.reverse())
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
      // Remove tooltip
      d3.selectAll('.hexbin-tooltip').remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isNil(hexLayer)) {
      // Initialize Hex scaling
      hexLayer.colorScale();

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
