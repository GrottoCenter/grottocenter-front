import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { brown, blue, green } from '@mui/material/colors';
import { heatmapTypes } from './DataControl';

// Small colored dots for secondary layers
const DOT_STYLE = {
  [heatmapTypes.ENTRANCES]: {
    radius: 3,
    color: brown[900],
    weight: 0.5,
    fillColor: brown[500],
    fillOpacity: 0.7
  },
  [heatmapTypes.NETWORKS]: {
    radius: 3,
    color: blue[900],
    weight: 0.5,
    fillColor: blue[500],
    fillOpacity: 0.7
  },
  [heatmapTypes.MASSIFS]: {
    radius: 3,
    color: green[900],
    weight: 0.5,
    fillColor: green[500],
    fillOpacity: 0.7
  }
};

/**
 * POC 5 — Renders small colored CircleMarkers for secondary data layers.
 *
 * The primary layer uses the existing hexbin heatmap. Secondary layers
 * are shown as tiny dots so they don't occlude the hexagons but remain
 * visible for spatial comparison.
 */
const useSecondaryDots = () => {
  const map = useMap();
  const layerGroupsRef = useRef({});

  // Create layer groups once
  useEffect(() => {
    Object.values(heatmapTypes).forEach(type => {
      if (type === heatmapTypes.NONE) return;
      layerGroupsRef.current[type] = L.layerGroup().addTo(map);
    });

    return () => {
      Object.values(layerGroupsRef.current).forEach(lg => {
        lg.clearLayers();
        map.removeLayer(lg);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Update which types show dots.
   * @param {Object} dataByType - { entrances: [[lng,lat],...], ... }
   * @param {string[]} secondaryTypes - types to render as dots
   */
  const updateDots = useCallback((dataByType, secondaryTypes) => {
    Object.entries(layerGroupsRef.current).forEach(([type, lg]) => {
      lg.clearLayers();

      if (!secondaryTypes.includes(type)) return;

      const coords = dataByType[type] || [];
      const style = DOT_STYLE[type];
      if (!style || coords.length === 0) return;

      // Only render dots visible in the current viewport for performance
      const bounds = map.getBounds();
      coords.forEach(([lng, lat]) => {
        if (!bounds.contains([lat, lng])) return;
        L.circleMarker([lat, lng], style).addTo(lg);
      });
    });
  }, [map]);

  return { updateDots };
};

export default useSecondaryDots;
