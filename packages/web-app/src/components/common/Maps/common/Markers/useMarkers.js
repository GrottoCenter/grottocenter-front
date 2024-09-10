import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { BrowserRouter } from 'react-router-dom';
import {
  ThemeProvider,
  StyledEngineProvider,
  keyframes,
  css
} from '@mui/material/styles';
import { GlobalStyles } from '@mui/material';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';
import grottoTheme from '../../../../../conf/grottoTheme';

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

export const MarkerGlobalCss = (
  <GlobalStyles
    styles={css`
      & .fade-in-markers {
        animation: 0.3s ${fadeIn} ease-out;
      }

      .leaflet-container {
        font-size: 1rem;
      }
    `}
  />
);

const useMarkers = ({
  icon,
  popupContent = null,
  tooltipContent = null,
  shouldFitMapBound = false
}) => {
  const map = useMap();
  const [canvas] = useState(L.canvas());
  const [markers, setMarkers] = useState([]);
  const { locale, messages } = useSelector(state => state.intl);
  const options = { icon, renderer: canvas };

  const makeMarkers = newMarkers =>
    newMarkers.map(marker => {
      const { latitude, longitude } = marker;
      const markerEl = L.marker([latitude, longitude], options);

      if (popupContent) {
        markerEl.bindPopup(
          renderToString(
            // Without theme provider the CSS doesn't work properly
            // It's makes the map slower when there is a lot of markers
            // One way to optimize it would be to not use MUI for the markers
            <IntlProvider locale={locale} messages={messages[locale]}>
              <BrowserRouter>
                <StyledEngineProvider injectFirst>
                  <ThemeProvider theme={grottoTheme}>
                    {popupContent(marker)}
                  </ThemeProvider>
                </StyledEngineProvider>
              </BrowserRouter>
            </IntlProvider>
          )
        );
      }

      if (tooltipContent) {
        markerEl.bindTooltip(`${tooltipContent(marker)}`, {});
      }

      return markerEl;
    });

  useEffect(() => {
    for (const marker of markers) marker.addTo(map);

    if (shouldFitMapBound && markers.length > 0) {
      map.fitBounds(
        markers.map(e => e.getLatLng()),
        { padding: [40, 40], maxZoom: 16 }
      );
    }
  }, [markers, map, shouldFitMapBound]);

  return newMarkers => {
    for (const marker of markers) marker.remove(map);
    if (newMarkers && newMarkers.length > 0)
      setMarkers(makeMarkers(newMarkers));
  };
};

export default useMarkers;
