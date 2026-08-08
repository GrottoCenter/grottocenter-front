import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button } from '@mui/material';
import Alert from './Alert';
import { isNetworkError } from '../../utils/networkError';
import { useOnlineStatus } from '../../hooks';

/**
 * What an entity page shows instead of its content when the fetch failed.
 *
 * Offline, the data exists on the server and simply hasn't been downloaded —
 * that is an `info`, not an `error`. Showing the same red alert as for a real
 * failure tells the user something is broken when nothing is.
 *
 * The Retry button only appears when the network is available: offering an
 * action we know cannot succeed is worse than offering none. Pages pair this
 * with useRefetchOnReconnect so the content repairs itself instead.
 */
const FetchErrorState = ({ error, messageId, onRetry = null }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  // isNetworkError also matches "Failed to fetch" raised while ONLINE — API
  // down, DNS, CORS. Promising that content "will load once you are back
  // online" to someone who never left would be wrong, and the Retry button
  // shown next to it would contradict it. Only claim offline when we are.
  const isOffline = isNetworkError(error) && !isOnline;

  return (
    <Alert
      data-testid="fetch-error-state"
      severity={isOffline ? 'info' : 'error'}
      // Shares OfflineDisabled's label rather than carrying its own: the two
      // said the same thing in every language but English, so the second key
      // was pure translation debt.
      title={formatMessage({
        id: isOffline ? 'offlineActionUnavailable' : messageId
      })}
      content={
        isOffline ? formatMessage({ id: 'offlineContentUnavailable' }) : null
      }
      action={
        onRetry && isOnline ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {formatMessage({ id: 'Retry' })}
          </Button>
        ) : undefined
      }
    />
  );
};

FetchErrorState.propTypes = {
  // Any of the error shapes stored in Redux — see utils/networkError.js.
  // A few reducers keep the bare message string, hence the string variant.
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.instanceOf(Error)
  ]).isRequired,
  // i18n id of the entity-specific message, used when the failure is NOT a
  // network one (e.g. "Error, the entrance data … is not available.")
  messageId: PropTypes.string.isRequired,
  onRetry: PropTypes.func
};

export default FetchErrorState;
