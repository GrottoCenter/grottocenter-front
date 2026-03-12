import React, { useRef, useCallback, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { GlobalStyles } from '@mui/material';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';
import grottoTheme from '../../../../../conf/grottoTheme';

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
  shouldFitMapBound = false
}) => {
  const map = useMap();
  // Map<id, L.Marker> for O(1) lookups during diff
  const markersRef = useRef(new Map());
  const { locale, messages } = useSelector(state => state.intl);

  // Store locale/messages in refs so renderPopupHtml never goes stale
  // but doesn't invalidate the callback chain either
  const localeRef = useRef(locale);
  const messagesRef = useRef(messages);
  localeRef.current = locale;
  messagesRef.current = messages;

  const renderPopupHtml = useCallback(
    marker => {
      const loc = localeRef.current;
      const msgs = messagesRef.current;
      return renderToString(
        <IntlProvider locale={loc} messages={msgs[loc]}>
          <StaticRouter location="/">
            <StyledEngineProvider injectFirst>
              <ThemeProvider theme={grottoTheme}>
                {popupContent(marker)}
              </ThemeProvider>
            </StyledEngineProvider>
          </StaticRouter>
        </IntlProvider>
      );
    },
    [popupContent]
  );

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
        markerEl = L.marker([latitude, longitude], { icon });
      }

      // Lazy popup: content is rendered only when the popup is opened
      if (popupContent) {
        markerEl.bindPopup(() => renderPopupHtml(marker));
      }

      if (tooltipContent) {
        markerEl.bindTooltip(`${tooltipContent(marker)}`, {});
        // On touch devices a tap fires both tooltip and popup; hide tooltip on click
        // (fires before popupopen, works reliably for both L.marker and L.circleMarker)
        markerEl.on('click', () => markerEl.closeTooltip());
      }

      return markerEl;
    },
    [icon, circleMarkerStyle, popupContent, renderPopupHtml, tooltipContent]
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
