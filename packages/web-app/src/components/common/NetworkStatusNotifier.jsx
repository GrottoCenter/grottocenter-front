import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
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
  const { onWarning, onSuccess, onClose } = useNotification();
  // Nothing to announce on mount: launching the app already offline is shown
  // by the AppBar indicator, and a "you are offline" popup on first paint reads
  // as a failure rather than as a change of state.
  const hasBeenOffline = useRef(false);

  // NODES, not formatMessage() strings. The offline snackbar is persistent and
  // keyed, so preventDuplicate makes notistack DISCARD every re-enqueue —
  // whatever text it is created with is the text it keeps for good. And
  // launching already offline enqueues it before bootstrapIntl has resolved
  // /lang/*.json, i.e. while IntlProvider still has no messages at all, so that
  // text would be the raw message id. A node follows the intl context instead:
  // it picks up the translation when it lands, and any later locale change,
  // with no re-enqueue and no flash. This only works because SnackbarProvider
  // sits BELOW HydratedIntlProvider (see ApplicationShell).
  //
  // Keeping backOnline a node too is what leaves this effect with nothing
  // locale-dependent in its deps, so it only ever runs on a real connectivity
  // change rather than on every language switch.
  useEffect(() => {
    if (!isOnline) {
      hasBeenOffline.current = true;
      onWarning(<FormattedMessage id="offlineIndicator" />, {
        key: OFFLINE_SNACKBAR_KEY,
        persist: true,
        // Load-bearing in development: StrictMode runs effects
        // mount→cleanup→mount, which would otherwise stack two snackbars.
        preventDuplicate: true,
        action: createCloseAction(onClose)
      });
      return;
    }

    onClose(OFFLINE_SNACKBAR_KEY);
    if (hasBeenOffline.current) {
      hasBeenOffline.current = false;
      onSuccess(<FormattedMessage id="backOnline" />);
    }
  }, [isOnline, onWarning, onSuccess, onClose]);

  return null;
};

export default NetworkStatusNotifier;
