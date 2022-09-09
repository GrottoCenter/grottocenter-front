import * as React from 'react';
import { useSnackbar } from 'notistack';

export const useNotification = () => {
  const { enqueueSnackbar } = useSnackbar();

  const enqueueNotification = React.useCallback(
    type => message => {
      enqueueSnackbar(message instanceof Error ? message.message : message, {
        variant: type
      });
    },
    [enqueueSnackbar]
  );

  const handleError = React.useCallback(
    message => {
      enqueueNotification('error')(message);
    },
    [enqueueNotification]
  );

  const handleWarning = React.useCallback(
    message => {
      enqueueNotification('warning')(message);
    },
    [enqueueNotification]
  );

  const handleSuccess = React.useCallback(
    message => {
      enqueueNotification('success')(message);
    },
    [enqueueNotification]
  );

  const handleInfo = React.useCallback(
    message => {
      enqueueNotification('info')(message);
    },
    [enqueueNotification]
  );

  return {
    onError: handleError,
    onWarning: handleWarning,
    onSuccess: handleSuccess,
    onInfo: handleInfo
  };
};
