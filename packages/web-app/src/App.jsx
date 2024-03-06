import React, { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import createDebounce from 'redux-debounced';
import { SnackbarProvider } from 'notistack';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PropTypes from 'prop-types';

import grottoTheme from './conf/grottoTheme';
import GCReducer from './reducers/GCReducer';
import { bootstrapIntl } from './actions/Intl';
import Application from './pages/Application';
import ErrorHandler from './components/appli/ErrorHandler';
import ErrorBoundary from './components/appli/ErrorBoundary';
import './App.css';

const middlewares = applyMiddleware(createDebounce(), thunkMiddleware);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const gcStore = createStore(GCReducer, composeEnhancers(middlewares));

const customOnIntlError = err => {
  /*
      Custom handler for missing translation.
      By default, it shows the stacktrace which is very annoying.
      This handler wrap everything in a collapsed group.
      */
  if (err.code === 'MISSING_TRANSLATION') {
    console.warn('MISSING_TRANSLATION', err.descriptor.id);
    return;
  }
  throw err;
};

const HydratedIntlProvider = ({ children }) => {
  const { locale, messages } = useSelector(state => state.intl);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bootstrapIntl());
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
  <StyledEngineProvider injectFirst>
    <CssBaseline />
    <ThemeProvider theme={grottoTheme}>
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
    </ThemeProvider>
  </StyledEngineProvider>
);

export default App;
