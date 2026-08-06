import { useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
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
      // A NODE, not a formatMessage() string: this snackbar is persistent and
      // keyed, so preventDuplicate makes notistack DISCARD every re-enqueue —
      // whatever text it was created with is the text it keeps for good. And
      // launching already offline enqueues it before bootstrapIntl has resolved
      // /lang/*.json, i.e. while IntlProvider still has no messages at all, so
      // that text would be the raw message id. Passing the node lets the
      // rendered snackbar follow the context instead: it picks up the
      // translation when it lands, and any later locale change, with no
      // re-enqueue and no flash.
      onWarning(<FormattedMessage id="offlineIndicator" />, {
        key: OFFLINE_SNACKBAR_KEY,
        persist: true,
        preventDuplicate: true,
        action: createCloseAction(onClose)
      });
      return;
    }

    onClose(OFFLINE_SNACKBAR_KEY);
    if (hasBeenOffline.current) {
      // Reset BEFORE announcing, so a later re-run of this effect while still
      // online (a locale change gives formatMessage a new identity) cannot
      // announce a reconnection that never happened.
      hasBeenOffline.current = false;
      // A string here, unlike the offline message above: this one is transient
      // and keyless, so it is never re-enqueued and has nothing to go stale.
      // Nodes are for the persistent, keyed snackbars — the ones whose text
      // preventDuplicate would otherwise freeze forever.
      onSuccess(formatMessage({ id: 'backOnline' }));
    }
  }, [isOnline, formatMessage, onWarning, onSuccess, onClose]);

  return null;
};

export default NetworkStatusNotifier;
