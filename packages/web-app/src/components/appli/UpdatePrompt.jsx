import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Button, Snackbar } from '@mui/material';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import { useRegisterSW } from 'virtual:pwa-register/react';

// A browser only re-checks sw.js when a document in scope is loaded (plus a
// 24h safety net). GrottoCenter is a client-routed SPA — and, once installed,
// a PWA/TWA users leave in the background for days — so that check can go a
// very long time without happening. We drive it ourselves instead: hourly, and
// every time the app comes back to the foreground (the moment that matters for
// an installed app resumed from the background).
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Registers the service worker and, when a new build is waiting, offers the
 * user an explicit "update now" action. `registerType: 'prompt'` (see
 * vite.config.mjs) means the new SW stays in `waiting` until the click below
 * sends it SKIP_WAITING — vite-plugin-pwa then reloads the page itself once
 * the new SW takes control.
 *
 * Rendered once, at app level. In development the virtual module resolves to a
 * no-op hook (devOptions.enabled: false), so nothing is ever shown.
 */
const UpdatePrompt = () => {
  const { formatMessage } = useIntl();
  const [registration, setRegistration] = useState(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW: (_swUrl, swRegistration) =>
      setRegistration(swRegistration ?? null)
  });

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

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert
        severity="info"
        icon={<SystemUpdateAltIcon fontSize="inherit" />}
        sx={{ alignItems: 'center', typography: 'body1' }}
        action={
          <>
            <Button
              color="inherit"
              size="small"
              onClick={() => setNeedRefresh(false)}>
              {formatMessage({ id: 'Later' })}
            </Button>
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              data-testid="update-app-btn"
              onClick={() => updateServiceWorker()}>
              {formatMessage({ id: 'Update' })}
            </Button>
          </>
        }>
        {formatMessage({ id: 'A new version is available' })}
      </Alert>
    </Snackbar>
  );
};

export default UpdatePrompt;
