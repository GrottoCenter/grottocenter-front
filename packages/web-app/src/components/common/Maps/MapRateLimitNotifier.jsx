import { useEffect, useSyncExternalStore } from 'react';
import { Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  claimMapRateLimitWarning,
  getMapRateLimit,
  subscribeMapRateLimit
} from '@/api/mapClient';
import { displayLoginDialog } from '@/actions/Login';
import { useNotification } from '@/hooks/useNotification';
import { usePermissions } from '@/hooks/usePermissions';
import { createCloseAction } from '../snackbarActions';

const SNACKBAR_KEY = 'map-rate-limit';

const MapRateLimitMessage = () => {
  const { isAuth } = usePermissions();
  const limit = useSyncExternalStore(subscribeMapRateLimit, getMapRateLimit);
  const minutes = Math.max(
    1,
    Math.ceil(((limit?.retryAt ?? 0) - Date.now()) / 60000)
  );
  return (
    <FormattedMessage
      id={
        isAuth ? 'mapRateLimit.retryAfter' : 'mapRateLimit.anonymousRetryAfter'
      }
      values={{ minutes }}
    />
  );
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
  const limit = useSyncExternalStore(subscribeMapRateLimit, getMapRateLimit);
  const isActive = limit?.retryAt > Date.now();
  const { onWarning, onClose } = useNotification();

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
