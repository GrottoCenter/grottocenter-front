import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useNotification, useOnlineStatus } from '../../hooks';
import { createCloseAction } from './snackbarActions';

const OFFLINE_SNACKBAR_KEY = 'network-offline';

/**
 * Announces connectivity changes. Renders nothing itself.
 *
 * Deliberately a bottom snackbar and NOT a top banner: a banner pushes the
 * whole page down, and offline matters most on mobile where that reflow is
 * worst — for a state that can last an entire caving trip. Material Design
 * lists "no internet connection" as a snackbar case and reserves banners for
 * messages requiring an action.
 *
 * The snackbar is the EVENT (dismissible, gone once acknowledged); the AppBar's
 * OfflineIndicator is the STATE (always there while offline, zero layout cost).
 */
const NetworkStatusNotifier = () => {
  const isOnline = useOnlineStatus();
  const { formatMessage } = useIntl();
  const { onWarning, onSuccess, onClose } = useNotification();
  // Nothing to announce on mount: launching the app already offline is shown
  // by the AppBar indicator, and a "you are offline" popup on first paint reads
  // as a failure rather than as a change of state.
  const hasBeenOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      hasBeenOffline.current = true;
      // Changing the language while offline re-runs this effect (formatMessage
      // is a new identity), but preventDuplicate keys on OFFLINE_SNACKBAR_KEY,
      // so the snackbar is not re-added — it just keeps its original wording
      // until the connection is back. Accepted: replacing it would flash.
      onWarning(formatMessage({ id: 'offlineIndicator' }), {
        key: OFFLINE_SNACKBAR_KEY,
        persist: true,
        preventDuplicate: true,
        action: createCloseAction(onClose, formatMessage({ id: 'Close' }))
      });
      return;
    }

    onClose(OFFLINE_SNACKBAR_KEY);
    if (hasBeenOffline.current) {
      // Reset BEFORE announcing, so a later re-run of this effect while still
      // online (a locale change gives formatMessage a new identity) cannot
      // announce a reconnection that never happened.
      hasBeenOffline.current = false;
      onSuccess(formatMessage({ id: 'backOnline' }));
    }
  }, [isOnline, formatMessage, onWarning, onSuccess, onClose]);

  return null;
};

export default NetworkStatusNotifier;
