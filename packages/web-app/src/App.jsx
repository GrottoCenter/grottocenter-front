import React, { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import createDebounce from 'redux-debounced';
import { SnackbarProvider } from 'notistack';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { BrowserRouter } from 'react-router-dom';
import {
  createTheme,
  MuiThemeProvider,
  StylesProvider
} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import PropTypes from 'prop-types';

import { includes, keys } from 'ramda';
import grottoTheme from './conf/grottoTheme';
import GCReducer from './reducers/GCReducer';
import { changeLanguage, loadLanguages } from './actions/Language';
import Application from './pages/Application';
import ErrorHandler from './components/appli/ErrorHandler';
import { DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES } from './conf/Config';
import './App.css';
import './animations.css';

const middlewares = applyMiddleware(createDebounce(), thunkMiddleware);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const gcStore = createStore(GCReducer, composeEnhancers(middlewares));

const initialLocale = navigator.language.split(/[-_]/)[0];
gcStore.dispatch(
  changeLanguage(
    includes(initialLocale, keys(AVAILABLE_LANGUAGES))
      ? initialLocale
      : DEFAULT_LANGUAGE
  )
);

const theme = createTheme(grottoTheme);

const customOnIntlError = err => {
  /*
      Custom handler for missing translation.
      By default, it shows the stacktrace which is very annoying.
      This handler wrap everything in a collapsed group.
      */
  if (err.code === 'MISSING_TRANSLATION') {
    console.groupCollapsed(`MISSING_TRANSLATION FOR ${err.descriptor.id}`); // eslint-disable-line no-console
    console.warn(
      `Missing Translation for message with id: \n${err.descriptor.id}`
    );
    console.groupEnd(); // eslint-disable-line no-console
    return;
  }
  throw err;
};

const HydratedIntlProvider = ({ children }) => {
  const { locale, messages } = useSelector(state => state.intl);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadLanguages(true));
  }, [dispatch]);
  return (
    <IntlProvider
      locale={locale}
      messages={messages[locale]}
      onError={customOnIntlError}>
      {children}
    </IntlProvider>
  );
};

HydratedIntlProvider.propTypes = {
  children: PropTypes.node
};

const App = () => (
  <StylesProvider injectFirst>
    <CssBaseline />
    <StyledThemeProvider theme={theme}>
      <MuiThemeProvider theme={theme}>
        <BrowserRouter>
          <div>
            <SnackbarProvider maxSnack={3}>
              <Provider store={gcStore}>
                <HydratedIntlProvider onError={customOnIntlError}>
                  <ErrorHandler />
                  <ErrorBoundary>
                    <Application />
                  </ErrorBoundary>
                </HydratedIntlProvider>
              </Provider>
            </SnackbarProvider>
          </div>
        </BrowserRouter>
      </MuiThemeProvider>
    </StyledThemeProvider>
  </StylesProvider>
);

export default App;
