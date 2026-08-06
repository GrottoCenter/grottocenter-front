import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useNotification } from '../../hooks';

// A browser only re-checks sw.js when a document in scope is loaded (plus a
// 24h safety net). GrottoCenter is a client-routed SPA — and, once installed,
// a PWA/TWA users leave in the background for days — so that check can go a
// very long time without happening. We drive it ourselves instead: hourly, and
// every time the app comes back to the foreground (the moment that matters for
// an installed app resumed from the background).
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

const UPDATE_SNACKBAR_KEY = 'sw-update';

// A component, so both labels are resolved at render time rather than captured
// when the snackbar is enqueued. The prompt is persistent and keyed, so
// notistack discards any re-enqueue — anything formatted up front would stay
// frozen in the language (or the raw message id) of that first moment.
const UpdateSnackbarActions = ({ onUpdate, onDismiss }) => {
  const { formatMessage } = useIntl();
  return (
    <>
      {/* variant="text" is explicit: the theme defaults every MuiButton
          to `contained`, which turns an alert action into a filled grey
          block. nowrap keeps the label on one line — "Mettre à jour",
          "Aktualisieren" … all wrap at 360dp otherwise. */}
      <Button
        color="inherit"
        size="small"
        variant="text"
        data-testid="update-app-btn"
        sx={{ whiteSpace: 'nowrap' }}
        onClick={onUpdate}>
        {formatMessage({ id: 'Update' })}
      </Button>
      <IconButton
        color="inherit"
        size="small"
        aria-label={formatMessage({ id: 'Later' })}
        onClick={onDismiss}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </>
  );
};

UpdateSnackbarActions.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired
};

// Kept at module scope on purpose: notistack wants `action` as a `key => node`
// function, and defining one inside the component would make React see a new
// component type on every render (react/no-unstable-nested-components).
//
// It IS a factory — one call returns a fresh (named) component per invocation —
// but that is benign here: the snackbar is keyed by UPDATE_SNACKBAR_KEY and
// `preventDuplicate` means notistack drops every re-enqueue, so the action is
// captured exactly once. Do NOT refactor this into a body-scoped component:
// the lint rule fires, and closing over the handlers is what the enqueue call
// needs anyway.
const updateAction = (onUpdate, onDismiss) =>
  function UpdateAction() {
    return <UpdateSnackbarActions onUpdate={onUpdate} onDismiss={onDismiss} />;
  };

/**
 * Registers the service worker and, when a new build is waiting, offers the
 * user an explicit "update now" action. `registerType: 'prompt'` (see
 * vite.config.mjs) means the new SW stays in `waiting` until the click below
 * sends it SKIP_WAITING; we then reload as soon as the new SW takes control.
 *
 * Rendered once, at app level, and renders nothing itself — the prompt goes
 * through the app-wide notistack stack so it can never overlap another
 * notification. In development the virtual module resolves to a no-op hook
 * (devOptions.enabled: false), so nothing is ever shown.
 */
const UpdatePrompt = () => {
  const { onInfo, onClose } = useNotification();
  const [registration, setRegistration] = useState(null);
  // Same value as the state above, mirrored in a ref so that handleUpdate can
  // stay referentially stable. The snackbar's action closure is captured once,
  // when the message is enqueued — and `preventDuplicate` means a later
  // re-enqueue with a fresher closure is DISCARDED, not applied. Reading the
  // registration through a ref is what keeps the button working when the SW
  // registers after the prompt is already on screen.
  const registrationRef = useRef(null);

  // useRegisterSW exposes its signals as [value, setter] tuples matching
  // React's useState convention — hence the nested destructuring below.
  const {
    needRefresh: [needRefresh, setNeedRefresh]
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW: (_swUrl, swRegistration) => {
      registrationRef.current = swRegistration ?? null;
      setRegistration(swRegistration ?? null);
    },
    // A silent failure here would kill the update mechanism entirely with
    // no trace; surface it so production monitoring can catch it.
    onRegisterError: err =>
      console.warn('[UpdatePrompt] SW registration failed', err)
  });

  const handleDismiss = useCallback(() => {
    onClose(UPDATE_SNACKBAR_KEY);
    setNeedRefresh(false);
  }, [onClose, setNeedRefresh]);

  // We drive skip-waiting + reload ourselves rather than delegating to the
  // hook's `updateServiceWorker`. That helper wraps workbox-window's
  // `messageSkipWaiting`, which posts to a cached `_registration.waiting`
  // reference — and on Firefox that reference has been observed to go stale
  // between the "waiting" event and the click (our own hourly
  // registration.update() calls can swap the waiting SW under it), which
  // makes the button silently no-op. Talking directly to the live
  // `registration.waiting` and listening for `controllerchange` on
  // navigator.serviceWorker sidesteps the whole issue.
  const handleUpdate = useCallback(() => {
    const waitingSW = registrationRef.current?.waiting;
    if (!waitingSW) {
      console.warn('[UpdatePrompt] Update clicked but no waiting SW found');
      // Best-effort dismissal so a broken state doesn't stay pinned on screen.
      handleDismiss();
      return;
    }
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => window.location.reload(),
      { once: true }
    );
    waitingSW.postMessage({ type: 'SKIP_WAITING' });
  }, [handleDismiss]);

  useEffect(() => {
    if (!needRefresh) return;
    // `persist` and no auto-hide on purpose: we want an explicit choice
    // (Update or Later), and a persistent notistack snackbar is not dismissed
    // by an outside click either — which is what the previous MUI <Snackbar>
    // had to opt out of ClickAwayListener to achieve.
    //
    // A NODE, not a formatMessage() string: persistent + keyed means
    // preventDuplicate discards every re-enqueue, so whatever text this is
    // created with is the text it keeps. The node follows the intl context
    // instead, which covers both a locale change and a prompt raised before
    // /lang/*.json has loaded.
    onInfo(<FormattedMessage id="A new version is available" />, {
      key: UPDATE_SNACKBAR_KEY,
      persist: true,
      preventDuplicate: true,
      icon: <SystemUpdateAltIcon fontSize="inherit" />,
      action: updateAction(handleUpdate, handleDismiss)
    });
  }, [needRefresh, onInfo, handleUpdate, handleDismiss]);

  useEffect(() => {
    if (!registration) return undefined;

    // update() rejects when sw.js can't be fetched (offline, captive portal,
    // deploy in flight). Nothing to do about it — the next tick tries again.
    const checkForUpdate = () => {
      if (!navigator.onLine) return;
      registration.update().catch(() => {});
    };

    const intervalId = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [registration]);

  return null;
};

export default UpdatePrompt;
