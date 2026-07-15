import React, { useRef, useCallback, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { GlobalStyles } from '@mui/material';
import useRenderPopup from './useRenderPopup';

export const MarkerGlobalCss = (
  <GlobalStyles
    styles={`
      .leaflet-container {
        font-size: 1rem;
      }
    `}
  />
);

const useMarkers = ({
  icon,
  circleMarkerStyle,
  popupContent = null,
  tooltipContent = null,
  onMarkerClick = null,
  onMarkerOver = null,
  onMarkerOut = null,
  onPopupOpen = null,
  onPopupClose = null,
  shouldFitMapBound = false,
  markerOptions = null
}) => {
  const map = useMap();
  // Map<id, L.Marker> for O(1) lookups during diff
  const markersRef = useRef(new Map());
  const renderPopup = useRenderPopup();

  const createLeafletMarker = useCallback(
    marker => {
      const { latitude, longitude } = marker;

      let markerEl;
      if (circleMarkerStyle) {
        const style =
          typeof circleMarkerStyle === 'function'
            ? circleMarkerStyle(marker)
            : circleMarkerStyle;
        markerEl = L.circleMarker([latitude, longitude], style);
      } else {
        markerEl = L.marker([latitude, longitude], { icon, ...markerOptions });
      }

      // Lazy popup: content is rendered only when the popup is opened
      if (popupContent) {
        markerEl.bindPopup(() => renderPopup(popupContent(marker)));
      }

      if (tooltipContent) {
        markerEl.bindTooltip(`${tooltipContent(marker)}`, {});
        // On touch devices a tap fires both tooltip and popup; hide tooltip on click
        // (fires before popupopen, works reliably for both L.marker and L.circleMarker)
        markerEl.on('click', () => {
          markerEl.closeTooltip();
          if (onMarkerClick) onMarkerClick(marker);
        });
      }

      // Listeners are cleaned up by Leaflet when markerEl.remove() is called.
      // This relies on callbacks being stable references (useCallback with stable
      // deps in Markers.jsx). If deps ever change identity, existing markers won't
      // get updated listeners — updateMarkers only adds/removes, never replaces.
      if (onMarkerOver) markerEl.on('mouseover', () => onMarkerOver(marker));
      if (onMarkerOut) markerEl.on('mouseout', () => onMarkerOut(marker));
      if (onPopupOpen) markerEl.on('popupopen', () => onPopupOpen(marker));
      if (onPopupClose) markerEl.on('popupclose', () => onPopupClose(marker));

      return markerEl;
    },
    [
      icon,
      circleMarkerStyle,
      popupContent,
      renderPopup,
      tooltipContent,
      onMarkerClick,
      onMarkerOver,
      onMarkerOut,
      onPopupOpen,
      onPopupClose,
      markerOptions
    ]
  );

  const updateMarkers = useCallback(
    newMarkers => {
      const currentMap = markersRef.current;

      if (!newMarkers || newMarkers.length === 0) {
        // Remove all markers
        for (const m of currentMap.values()) m.remove();
        currentMap.clear();
        return;
      }

      const newIds = new Set();
      for (const m of newMarkers) newIds.add(m.id);

      // Remove markers no longer present
      for (const [id, leafletMarker] of currentMap) {
        if (!newIds.has(id)) {
          leafletMarker.remove();
          currentMap.delete(id);
        }
      }

      // Add markers that are new
      let addedCount = 0;
      for (const marker of newMarkers) {
        if (!currentMap.has(marker.id)) {
          const leafletMarker = createLeafletMarker(marker);
          leafletMarker.addTo(map);
          currentMap.set(marker.id, leafletMarker);
          addedCount += 1;
        }
      }

      // Fit bounds on initial load if requested
      if (
        shouldFitMapBound &&
        currentMap.size > 0 &&
        addedCount === currentMap.size
      ) {
        map.fitBounds(
          Array.from(currentMap.values()).map(m => m.getLatLng()),
          { padding: [40, 40], maxZoom: 16 }
        );
      }
    },
    [map, createLeafletMarker, shouldFitMapBound]
  );

  // Cleanup all markers on unmount
  useEffect(() => {
    const currentMarkers = markersRef.current;
    return () => {
      for (const m of currentMarkers.values()) m.remove();
      currentMarkers.clear();
    };
  }, []);

  return updateMarkers;
};

export default useMarkers;
