import { useRef, useCallback } from 'react';
import { renderToString } from 'react-dom/server';
// Imported from react-router-dom (which re-exports react-router) and NOT from
// react-router directly: react-router-dom pins react-router to an exact version,
// so a direct dependency on it lets a lockfile resolve two copies of the router.
// Two copies = two distinct NavigationContext objects, and the <AppLink> links
// rendered below (react-router-dom) would read a context this StaticRouter never
// provided → "useContext(...) is null" and no popup on marker click.
import { StaticRouter } from 'react-router-dom';
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
