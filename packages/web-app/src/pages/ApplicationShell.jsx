import React, { useRef, useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import createDebounce from 'redux-debounced';
import { isMobileOnly } from 'react-device-detect';
import { SnackbarProvider } from 'notistack';
import { createStore, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

import GCReducer from '../reducers/GCReducer';
import { bootstrapIntl } from '../actions/Intl';

import ErrorHandler from '../components/appli/ErrorHandler';
import ErrorBoundary from '../components/appli/PageErrorBounary';
import SideMenu from '../components/common/SideMenu';

import AppBar from '../components/common/AppBar';
import LoginDialog from '../components/appli/Login';

async function transitionToReact() {
  await intlBootstrap.initialFetchP; // Make sure strings of the initial locale are loaded

  const loaderEl = document.querySelector('.loader');
  if (!loaderEl) return;
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
    // console.warn('MISSING_TRANSLATION', err.descriptor.id);
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

const MainWrapper = styled('main')`
  flex-grow: 1;
  transition: ${({ theme, $isSideMenuOpen }) =>
    !isMobileOnly &&
    theme.transitions.create('margin', {
      easing: $isSideMenuOpen
        ? theme.transitions.easing.easeOut
        : theme.transitions.easing.sharp,
      duration: $isSideMenuOpen
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen
    })};
  margin-left: ${({ theme, $isSideMenuOpen }) =>
    !isMobileOnly && ($isSideMenuOpen ? theme.sideMenuWidth : 0)}px;
`;

const ApplicationLayout = () => {
  const isSideMenuOpen = useSelector(state => state.sideMenu.open);

  const firstRender = useRef(true);
  useEffect(() => {
    if (!firstRender.current) return;
    transitionToReact();
    firstRender.current = false;
  });

  return (
    <>
      <AppBar />
      <SideMenu isOpen={isSideMenuOpen} />
      <MainWrapper $isSideMenuOpen={isSideMenuOpen}>
        <LoginDialog />

        {/* Where the individual routes will be rendered */}
        <Outlet />
      </MainWrapper>
    </>
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
