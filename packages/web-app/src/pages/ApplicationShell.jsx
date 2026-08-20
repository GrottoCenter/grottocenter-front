import { useCallback, useRef, useEffect, Suspense } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { SnackbarContent, SnackbarProvider } from 'notistack';
import PropTypes from 'prop-types';
import { styled, useTheme } from '@mui/material/styles';
import { Alert, Box, CircularProgress, useMediaQuery } from '@mui/material';

import store from '../store';
import {
  bootstrapIntl,
  changeLocale,
  hasLoadedMessages
} from '../actions/Intl';
import useLanguageSync from '../hooks/useLanguageSync';
import { useRefetchOnReconnect, useSideMenuOffset } from '../hooks';

import ErrorHandler from '../components/appli/ErrorHandler';
import NetworkStatusNotifier from '../components/common/NetworkStatusNotifier';
import SessionExpiryNotifier from '../components/common/SessionExpiryNotifier';
import ErrorBoundary from '../components/appli/PageErrorBounary';
import UpdatePrompt from '../components/appli/UpdatePrompt';
import SideMenu from '../components/common/SideMenu';

import AppBar from '../components/common/AppBar';
import ImpersonationIndicator from '../components/common/ImpersonationIndicator';
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

  // Launching offline before /lang/*.json ever reached the cache leaves the UI
  // on raw message ids. Nothing else would ever ask again — the locale doesn't
  // change on its own — so repair it the moment the connection is back rather
  // than making the user reload.
  const reloadMessages = useCallback(
    () => dispatch(changeLocale(locale)),
    [dispatch, locale]
  );
  useRefetchOnReconnect(reloadMessages, !hasLoadedMessages(messages, locale));

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

const MainWrapper = styled('main', {
  shouldForwardProp: prop => prop !== '$offset' && prop !== '$transition'
})`
  flex-grow: 1;
  transition: ${({ $transition }) => $transition};
  margin-left: ${({ $offset }) => $offset}px;
`;

const ApplicationLayout = () => {
  const { width: sideMenuOffset, transition } = useSideMenuOffset();
  useLanguageSync();

  const firstRender = useRef(true);
  useEffect(() => {
    if (!firstRender.current) return;
    transitionToReact();
    firstRender.current = false;
  });

  return (
    <>
      {/* Two traps for anything full-width rendered here rather than inside
          MainWrapper:
          - AppBar is position:fixed and renders its own toolbar spacer, so a
            banner placed BEFORE it is hidden behind it;
          - SideMenu is a fixed Drawer, and only MainWrapper carries the matching
            `margin-left`. A banner that skips it gets its first 240px covered on
            desktop — that was #1489. This is now MORE of a trap, not less: the
            desktop rail never fully retracts, so the margin is never 0 there.
          Prefer a snackbar (position:fixed, no layout offset to get wrong); if a
          banner is really needed, it has to reproduce MainWrapper's margin —
          `useSideMenuOffset()` hands out exactly that number. */}
      <AppBar />
      <SideMenu />
      {/* Fixed pill centred at the top of the viewport; renders null unless
          a real admin is currently previewing another role, so it has zero
          layout footprint for everyone else. Sibling of AppBar rather than
          inside MainWrapper: the side-menu margin doesn't apply — the pill
          is anchored to the viewport, not the content column. */}
      <ImpersonationIndicator />
      <MainWrapper $offset={sideMenuOffset} $transition={transition}>
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

          SnackbarProvider sits INSIDE Provider and HydratedIntlProvider, not
          around them: notistack renders snackbar content in its own subtree, so
          it must be below every context that content reads. That is what lets a
          persistent snackbar carry a <FormattedMessage> node and keep following
          the locale — see NetworkStatusNotifier.

          maxSnack MUST stay greater than the number of `persist` snackbars that
          can coexist (network-offline, sw-update, session-expiry): once every
          slot holds a persistent one, notistack stops queueing and dismisses the
          oldest instead, silently killing e.g. the update prompt. Adding a
          fourth persistent notification means raising maxSnack with it.

          NO `preventDuplicate` here: without a `key` notistack dedupes on the
          MESSAGE, which silently swallows legitimate repeats — reorder two rows
          in a row and the second "Order updated" never appears, taking its Undo
          link with it (useMoveRelevanceWithUndo). The three persistent
          notifiers each pass `preventDuplicate` themselves, keyed, which is
          where the flag actually belongs.

          Do not reinstate it here without checking the callers: message-based
          dedupe compares by identity, and a snackbar whose message is a React
          node (the notifiers all pass <FormattedMessage>) never matches itself,
          so it would opt out of deduplication silently. */}
      <Provider store={store}>
        <HydratedIntlProvider onError={customOnIntlError}>
          <SnackbarProvider
            maxSnack={4}
            dense={isCompact}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            Components={SNACKBAR_COMPONENTS}>
            <ErrorHandler />
            {/* Outside the boundary on purpose: when a stale build crashes the
                app, offering the update is exactly what fixes it. */}
            <UpdatePrompt />
            <NetworkStatusNotifier />
            <SessionExpiryNotifier />
            <ErrorBoundary>
              <ApplicationLayout />
            </ErrorBoundary>
          </SnackbarProvider>
        </HydratedIntlProvider>
      </Provider>
    </div>
  );
};

export default ApplicationShell;
