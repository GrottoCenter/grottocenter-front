import * as React from 'react';
import { useSnackbar } from 'notistack';

export const useNotification = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // `options` is forwarded as-is to notistack, so callers can reach for `key`,
  // `persist`, `anchorOrigin`, … without bypassing this hook. Used by
  // NetworkStatusNotifier to keep an offline message on screen until the
  // connection is back, then close it by key.
  const enqueueNotification = React.useCallback(
    type => (message, options) => {
      enqueueSnackbar(message instanceof Error ? message.message : message, {
        variant: type,
        ...options
      });
    },
    [enqueueSnackbar]
  );

  const handleError = React.useCallback(
    (message, options) => {
      enqueueNotification('error')(message, options);
    },
    [enqueueNotification]
  );

  const handleWarning = React.useCallback(
    (message, options) => {
      enqueueNotification('warning')(message, options);
    },
    [enqueueNotification]
  );

  const handleSuccess = React.useCallback(
    (message, options) => {
      enqueueNotification('success')(message, options);
    },
    [enqueueNotification]
  );

  const handleInfo = React.useCallback(
    (message, options) => {
      enqueueNotification('info')(message, options);
    },
    [enqueueNotification]
  );

  return {
    onError: handleError,
    onWarning: handleWarning,
    onSuccess: handleSuccess,
    onInfo: handleInfo,
    onClose: closeSnackbar
  };
};
