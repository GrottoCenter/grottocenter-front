import React, { useEffect, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { anyPass, forEach, isEmpty, isNil, map as rMap } from 'ramda';
import { renderToString } from 'react-dom/server';
import { BrowserRouter } from 'react-router-dom';
import {
  ThemeProvider,
  StyledEngineProvider,
  keyframes
} from '@mui/material/styles';
import { GlobalStyles } from '@mui/material';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';
import theme from '../../../../../conf/grottoTheme';

const isNilOrEmpty = anyPass([isNil, isEmpty]);

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
    styles={`
    & .fade-in-markers {
      animation: 0.3s ${fadeIn} ease-out;
     }

     .leaflet-container{
       font-size: 1rem;
     }`}
  />
);

const useMarkers = (icon, popupContent = null, tooltipContent = null) => {
  const map = useMap();
  const [canvas] = useState(L.canvas());
  const [markers, setMarkers] = useState(null);
  const options = { icon, renderer: canvas };
  const { locale, messages } = useSelector(state => state.intl);

  const makeMarkers = rMap(marker => {
    const { latitude, longitude } = marker;
    if (!isNil(popupContent)) {
      if (!isNil(tooltipContent)) {
        return L.marker([latitude, longitude], options)
          .bindPopup(
            renderToString(
              // Without theme provider the CSS doesn't work properly
              // It's makes the map slower when there is a lot of markers
              // One way to optimize it would be to not use MUI for the markers
              <IntlProvider locale={locale} messages={messages[locale]}>
                <BrowserRouter>
                  <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={theme}>
                      {popupContent(marker)}
                    </ThemeProvider>
                  </StyledEngineProvider>
                </BrowserRouter>
              </IntlProvider>
            )
          )
          .bindTooltip(`${tooltipContent(marker)}`, {});
      }
      return L.marker([latitude, longitude], options).bindPopup(
        renderToString(popupContent(marker))
      );
    }
    return L.marker([latitude, longitude], options);
  });

  const addMarkers = forEach(marker => marker.addTo(map));
  const deleteMarkers = forEach(marker => marker.remove(map));

  useEffect(() => {
    if (!isNilOrEmpty(markers)) {
      addMarkers(markers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  const handleUpdateMarkers = useCallback(
    newMarkers => {
      if (!isNilOrEmpty(markers)) {
        deleteMarkers(markers);
      }
      setMarkers(isNilOrEmpty(newMarkers) ? null : makeMarkers(newMarkers));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMarkers]
  );

  return handleUpdateMarkers;
};

export default useMarkers;
