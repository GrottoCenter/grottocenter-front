import { useRef, useEffect, useState, Suspense } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { IntlProvider, useIntl } from 'react-intl';
import createDebounce from 'redux-debounced';
import { isMobileOnly } from 'react-device-detect';
import { SnackbarContent, SnackbarProvider } from 'notistack';
import { createStore, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import PropTypes from 'prop-types';
import { styled, useTheme } from '@mui/material/styles';
import { Alert, Box, CircularProgress, useMediaQuery } from '@mui/material';
import { usePermissions } from '../hooks';

import GCReducer from '../reducers/GCReducer';
import mapCacheInvalidationMiddleware from '../middlewares/mapCacheInvalidationMiddleware';
import { bootstrapIntl } from '../actions/Intl';
import useLanguageSync from '../hooks/useLanguageSync';

import ErrorHandler from '../components/appli/ErrorHandler';
import NetworkStatusNotifier from '../components/common/NetworkStatusNotifier';
import ErrorBoundary from '../components/appli/PageErrorBounary';
import UpdatePrompt from '../components/appli/UpdatePrompt';
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

const middlewares = applyMiddleware(
  createDebounce(),
  thunk,
  mapCacheInvalidationMiddleware
);
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

// Custom notistack snackbar with standard MUI typography (body1 = 1rem).
// `action` is pulled out of the rest props and handed to the Alert rather than
// the SnackbarContent wrapper: it is what renders the close button a persistent
// snackbar needs to be dismissible (see NetworkStatusNotifier).
//
// notistack hands custom components the raw `action` option, unresolved — its
// own MaterialDesignContent calls `action(id)` when it is a function, and a
// custom component has to do the same or a function action would be rendered
// as a React child and throw.
// `icon` is destructured out for the same reason as `action`: notistack
// forwards unknown enqueueSnackbar options to the custom component, and letting
// it fall into `rest` would spread a React element onto SnackbarContent's div.
// Pulling it out is also what lets a caller override the severity icon
// (UpdatePrompt uses SystemUpdateAltIcon); `undefined` keeps Alert's default.
const AppSnackbar = ({ id, message, variant, action, icon, ref, ...rest }) => {
  const severity = variant === 'default' ? 'info' : variant;
  const resolvedAction = typeof action === 'function' ? action(id) : action;
  return (
    <SnackbarContent ref={ref} {...rest}>
      <Alert
        severity={severity}
        action={resolvedAction}
        icon={icon}
        sx={{
          width: '100%',
          alignItems: 'center',
          typography: 'body1',
          // Alert's action slot is top-aligned and padded by default, which
          // reads as off-centre as soon as the message wraps to two lines.
          '& .MuiAlert-action': { alignItems: 'center', pt: 0 }
        }}>
        {message}
      </Alert>
    </SnackbarContent>
  );
};
AppSnackbar.displayName = 'AppSnackbar';
AppSnackbar.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  message: PropTypes.node,
  variant: PropTypes.string,
  action: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  icon: PropTypes.node,
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
    <Alert severity="warning" onClose={handleDismiss} sx={{ borderRadius: 0 }}>
      {formatMessage({ id: 'mfaSessionExpiryWarning' })}
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
      {/* AppBar is position:fixed and renders its own toolbar spacer, so any
          banner rendered BEFORE it would be visually hidden behind it. Keep
          banners after <AppBar /> so they sit right below the toolbar. */}
      <AppBar />
      <AdminSessionExpiryBanner />
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

const ApplicationShell = () => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <div>
      {/* Single snackbar system for the whole app — nothing renders a bare MUI
          <Snackbar>, or it would stack independently and overlap this one.

          maxSnack MUST stay greater than the number of `persist` snackbars that
          can coexist (network-offline, sw-update, session-expiry): once every
          slot holds a persistent one, notistack stops queueing and dismisses the
          oldest instead, silently killing e.g. the update prompt. Adding a
          fourth persistent notification means raising maxSnack with it. */}
      <SnackbarProvider
        maxSnack={4}
        preventDuplicate
        dense={isCompact}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        Components={SNACKBAR_COMPONENTS}>
        <Provider store={gcStore}>
          <HydratedIntlProvider onError={customOnIntlError}>
            <ErrorHandler />
            {/* Outside the boundary on purpose: when a stale build crashes the
                app, offering the update is exactly what fixes it. */}
            <UpdatePrompt />
            <NetworkStatusNotifier />
            <ErrorBoundary>
              <ApplicationLayout />
            </ErrorBoundary>
          </HydratedIntlProvider>
        </Provider>
      </SnackbarProvider>
    </div>
  );
};

export default ApplicationShell;
