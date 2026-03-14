import React, { useRef, useCallback } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';
import grottoTheme from '../../../../../conf/grottoTheme';

/**
 * Returns a stable `renderPopup(reactElement)` function that wraps
 * the given element with all required providers (i18n, theme, router)
 * and returns an HTML string suitable for Leaflet popups.
 */
const useRenderPopup = () => {
  const { locale, messages } = useSelector(state => state.intl);

  // Refs keep the callback stable while always reading fresh values
  const localeRef = useRef(locale);
  const messagesRef = useRef(messages);
  localeRef.current = locale;
  messagesRef.current = messages;

  return useCallback(content => {
    const loc = localeRef.current;
    const msgs = messagesRef.current;
    return renderToString(
      <IntlProvider locale={loc} messages={msgs[loc]}>
        <StaticRouter location="/">
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={grottoTheme}>{content}</ThemeProvider>
          </StyledEngineProvider>
        </StaticRouter>
      </IntlProvider>
    );
  }, []);
};

export default useRenderPopup;
