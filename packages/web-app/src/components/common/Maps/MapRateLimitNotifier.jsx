import { useEffect } from 'react';
import { Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { claimMapRateLimitWarning, recordMapRateLimit } from '@/api/mapClient';
import { displayLoginDialog } from '@/actions/Login';
import { useMapRateLimit } from '@/hooks/useMapRateLimit';
import { useNotification } from '@/hooks/useNotification';
import { usePermissions } from '@/hooks/usePermissions';
import { createCloseAction } from '../snackbarActions';

const SNACKBAR_KEY = 'map-rate-limit';

const MapRateLimitMessage = () => {
  const { isAuth } = usePermissions();
  const { limit, minutes } = useMapRateLimit();
  if (!isAuth && limit?.hasServerDeadline)
    return (
      <FormattedMessage
        id="mapRateLimit.anonymousRetryAfter"
        values={{ minutes }}
      />
    );
  if (!isAuth) return <FormattedMessage id="mapRateLimit.anonymous" />;
  if (limit?.hasServerDeadline)
    return (
      <FormattedMessage id="mapRateLimit.retryAfter" values={{ minutes }} />
    );
  return <FormattedMessage id="mapRateLimit.authenticated" />;
};

const MapRateLimitActions = ({ snackbarKey }) => {
  const { isAuth } = usePermissions();
  const dispatch = useDispatch();
  const { onClose } = useNotification();
  return (
    <>
      {!isAuth && (
        <Button
          color="inherit"
          variant="outlined"
          size="small"
          sx={{ whiteSpace: 'nowrap' }}
          data-testid="map-rate-limit-login"
          onClick={() => dispatch(displayLoginDialog())}>
          <FormattedMessage id="Log in" />
        </Button>
      )}
      {createCloseAction(onClose)(snackbarKey)}
    </>
  );
};

MapRateLimitActions.propTypes = { snackbarKey: PropTypes.string.isRequired };

const mapRateLimitActions = snackbarKey => (
  <MapRateLimitActions snackbarKey={snackbarKey} />
);

const MapRateLimitNotifier = () => {
  const { limit, isActive } = useMapRateLimit();
  const { onWarning, onClose } = useNotification();

  useEffect(() => {
    const worker = navigator.serviceWorker;
    if (!worker) return undefined;
    const handleMessage = event => {
      if (
        event.source !== worker.controller ||
        event.data?.type !== 'grottocenter-map-rate-limit'
      )
        return;
      recordMapRateLimit({
        retryAt: event.data.retryAt,
        hasServerDeadline: event.data.hasServerDeadline === true
      });
    };
    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const key = limit ? `${SNACKBAR_KEY}-${limit.episode}` : null;
    if (!isActive) {
      if (key) onClose(key);
      return;
    }
    if (!claimMapRateLimitWarning()) return;
    onWarning(<MapRateLimitMessage />, {
      key,
      persist: true,
      preventDuplicate: true,
      action: mapRateLimitActions
    });
  }, [limit, isActive, onWarning, onClose]);

  return null;
};

export default MapRateLimitNotifier;
