import React, { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNotification, useOnlineStatus } from '../../hooks';

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
      onWarning(formatMessage({ id: 'offlineIndicator' }), {
        key: OFFLINE_SNACKBAR_KEY,
        persist: true,
        preventDuplicate: true,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        action: key => (
          <IconButton
            size="small"
            color="inherit"
            aria-label={formatMessage({ id: 'Close' })}
            onClick={() => onClose(key)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )
      });
      return;
    }

    onClose(OFFLINE_SNACKBAR_KEY);
    if (hasBeenOffline.current) {
      onSuccess(formatMessage({ id: 'backOnline' }), {
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
      });
    }
  }, [isOnline, formatMessage, onWarning, onSuccess, onClose]);

  return null;
};

export default NetworkStatusNotifier;
