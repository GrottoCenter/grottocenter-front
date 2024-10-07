import React, { useRef, useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import createDebounce from 'redux-debounced';
import { SnackbarProvider } from 'notistack';
import { createStore, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import PropTypes from 'prop-types';

import GCReducer from '../reducers/GCReducer';
import { bootstrapIntl } from '../actions/Intl';
import ErrorHandler from '../components/appli/ErrorHandler';
import ErrorBoundary from '../components/appli/PageErrorBounary';
import { usePermissions } from '../hooks';
import Layout from '../components/common/Layouts/Main';

import AppBar from '../components/appli/AppBar';
import LoginDialog from '../components/appli/Login';
import QuickSearch from '../components/appli/QuickSearch';

async function transitionToReact() {
  await intlBootstrap.initialFetchP; // Make sure strings of the initial locale are loaded

  const loaderEl = document.querySelector('.loader');
  loaderEl.classList.add('loaderOff');
  document.querySelector('#root').classList.add('rootDisplay');
  setTimeout(() => {
    // Remove the loader element after the opacity transition
    loaderEl.remove();
  }, 410);
}

const middlewares = applyMiddleware(createDebounce(), thunk);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const gcStore = createStore(GCReducer, composeEnhancers(middlewares));

const customOnIntlError = err => {
  // Custom handler for missing translation.
  // By default, it shows the stacktrace which is very annoying.
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

const ApplicationLayout = () => {
  const dispatch = useDispatch();
  const isSideMenuOpen = useSelector(state => state.sideMenu.open);
  const permissions = usePermissions();
  const toggleSideMenu = () => dispatch({ type: 'TOGGLE_SIDEMENU' });

  const firstRender = useRef(true);
  useEffect(() => {
    if (!firstRender.current) return;
    transitionToReact();
    firstRender.current = false;
  });

  return (
    <Layout
      AppBar={() => (
        <AppBar
          isSideMenuOpen={isSideMenuOpen}
          toggleSideMenu={toggleSideMenu}
          HeaderQuickSearch={() => <QuickSearch hasFixWidth={false} />}
        />
      )}
      isAuth={permissions.isAuth}
      isSideMenuOpen={isSideMenuOpen}
      toggleSideMenu={toggleSideMenu}
      SideBarQuickSearch={() => <QuickSearch />}>
      <LoginDialog />

      {/* Where the individual routes will be rendered */}
      <Outlet />
    </Layout>
  );
};

const ApplicationShell = () => (
  <div>
    <SnackbarProvider maxSnack={3}>
      <Provider store={gcStore}>
        <HydratedIntlProvider onError={customOnIntlError}>
          <ErrorHandler />
          <ErrorBoundary>
            <ApplicationLayout />
          </ErrorBoundary>
        </HydratedIntlProvider>
      </Provider>
    </SnackbarProvider>
  </div>
);

export default ApplicationShell;
