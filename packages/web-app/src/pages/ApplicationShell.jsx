import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { IntlProvider, useIntl } from 'react-intl';
import createDebounce from 'redux-debounced';
import { isMobileOnly } from 'react-device-detect';
import { SnackbarContent, SnackbarProvider } from 'notistack';
import { createStore, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Alert, Box, CircularProgress } from '@mui/material';
import { usePermissions, useOnlineStatus } from '../hooks';

import GCReducer from '../reducers/GCReducer';
import { bootstrapIntl } from '../actions/Intl';
import useLanguageSync from '../hooks/useLanguageSync';

import ErrorHandler from '../components/appli/ErrorHandler';
import ErrorBoundary from '../components/appli/PageErrorBounary';
import SideMenu from '../components/common/SideMenu';

import AppBar from '../components/common/AppBar';
import LoginDialog from '../components/appli/Login';

async function transitionToReact() {
  // Wait for the initial locale strings, but never let a failure (e.g. PWA
  // launched offline before /lang/*.json was cached) keep the splash loader
  // on screen — better to render with untranslated ids than to be stuck.
  try {
    await intlBootstrap.initialFetchP;
  } catch {
    /* handled in index.html; kept here as belt-and-braces */
  }

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

// Custom notistack snackbar with standard MUI typography (body1 = 1rem)
const AppSnackbar = ({ id: _id, message, variant, ref, ...rest }) => {
  const severity = variant === 'default' ? 'info' : variant;
  return (
    <SnackbarContent ref={ref} {...rest}>
      <Alert severity={severity} sx={{ width: '100%', typography: 'body1' }}>
        {message}
      </Alert>
    </SnackbarContent>
  );
};
AppSnackbar.displayName = 'AppSnackbar';
AppSnackbar.propTypes = {
  id: PropTypes.string,
  message: PropTypes.node,
  variant: PropTypes.string,
  ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
};

const SNACKBAR_COMPONENTS = {
  default: AppSnackbar,
  info: AppSnackbar,
  success: AppSnackbar,
  error: AppSnackbar,
  warning: AppSnackbar
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

const SECONDS_IN_DAY = 86400;

const AdminSessionExpiryBanner = () => {
  const { formatMessage } = useIntl();
  const { isAdmin } = usePermissions();
  const authTokenDecoded = useSelector(state => state.login.authTokenDecoded);
  const userId = authTokenDecoded?.id;
  const storageKey = userId
    ? `mfaExpiryBannerDismissed_${userId}`
    : 'mfaExpiryBannerDismissed';
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(storageKey) === 'true'
  );
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isAdmin || dismissed || !authTokenDecoded?.exp) return undefined;
    const msUntilThreshold =
      (authTokenDecoded.exp - SECONDS_IN_DAY) * 1000 - Date.now();
    if (msUntilThreshold <= 0) return undefined;
    const timer = setTimeout(() => setTick(t => t + 1), msUntilThreshold);
    return () => clearTimeout(timer);
  }, [authTokenDecoded?.exp, isAdmin, dismissed]);

  if (!isAdmin || dismissed || !authTokenDecoded?.exp) return null;

  const secondsUntilExpiry = authTokenDecoded.exp - Date.now() / 1000;
  if (secondsUntilExpiry >= SECONDS_IN_DAY) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  return (
    <Alert
      severity="warning"
      onClose={handleDismiss}
      sx={{ borderRadius: 0 }}>
      {formatMessage({ id: 'mfaSessionExpiryWarning' })}
    </Alert>
  );
};

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const { formatMessage } = useIntl();
  if (isOnline) return null;
  return (
    <Alert severity="warning" sx={{ borderRadius: 0 }}>
      {formatMessage({ id: 'offlineBanner' })}
    </Alert>
  );
};

const ApplicationLayout = () => {
  const isSideMenuOpen = useSelector(state => state.sideMenu.open);
  useLanguageSync();

  const firstRender = useRef(true);
  useEffect(() => {
    if (!firstRender.current) return;
    transitionToReact();
    firstRender.current = false;
  });

  return (
    <>
      <OfflineBanner />
      <AdminSessionExpiryBanner />
      <AppBar />
      <SideMenu isOpen={isSideMenuOpen} />
      <MainWrapper $isSideMenuOpen={isSideMenuOpen}>
        <LoginDialog />

        {/* Where the individual routes will be rendered.
            Suspense covers the lazily-loaded route components (code-splitting). */}
        <Suspense
          fallback={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
              }}>
              <CircularProgress />
            </Box>
          }>
          <Outlet />
        </Suspense>
      </MainWrapper>
    </>
  );
};

const ApplicationShell = () => (
  <div>
    <SnackbarProvider maxSnack={3} Components={SNACKBAR_COMPONENTS}>
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
