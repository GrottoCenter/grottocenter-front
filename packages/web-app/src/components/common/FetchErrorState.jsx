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
 *
 * React Query callers pass `isPaused`, not `error`. Under the app's
 * `networkMode: 'offlineFirst'` (see conf/queryClient.js) a query whose first
 * attempt failed offline holds its retry rather than failing: it reports
 * `fetchStatus === 'paused'` with `status: 'pending'` and a null error. Reading
 * only `isError` there would leave a spinner on screen forever, so the paused
 * flag is the signal that says "offline" in the React Query world:
 *
 *   const { data, isError, error, fetchStatus } = useCave(id);
 *   if (isError || fetchStatus === 'paused')
 *     return <FetchErrorState error={error} isPaused={fetchStatus === 'paused'} … />;
 */
const FetchErrorState = ({
  error = null,
  messageId,
  onRetry = null,
  isPaused = false
}) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  // isNetworkError also matches "Failed to fetch" raised while ONLINE — API
  // down, DNS, CORS. Promising that content "will load once you are back
  // online" to someone who never left would be wrong, and the Retry button
  // shown next to it would contradict it. Only claim offline when we are.
  //
  // A paused query needs no such check: React Query only pauses on its own
  // offline signal, so the state itself is the proof.
  const isOffline = isPaused || (isNetworkError(error) && !isOnline);

  return (
    <Alert
      data-testid="fetch-error-state"
      severity={isOffline ? 'info' : 'error'}
      // Reuses the i18n key `offlineActionUnavailable` (also used by
      // OfflineDisabled) as the Alert title rather than carrying its own: one
      // key already covers both surfaces, so a second one would be the same
      // sentence to translate twice, in every language.
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

const errorShape = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.string,
  PropTypes.instanceOf(Error)
]);

FetchErrorState.propTypes = {
  // Any of the error shapes stored in Redux — see utils/networkError.js.
  // A few reducers keep the bare message string, hence the string variant.
  //
  // Required, except when `isPaused` is set: a paused React Query has no error
  // yet, and demanding one would push callers into passing a fake.
  error: (props, propName, componentName) => {
    if (props.isPaused || props[propName] != null)
      return errorShape(props, propName, componentName);
    return new Error(
      `\`error\` is required in \`${componentName}\` unless \`isPaused\` is set.`
    );
  },
  // i18n id of the entity-specific message, used when the failure is NOT a
  // network one (e.g. "Error, the entrance data … is not available.")
  messageId: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
  // React Query's `fetchStatus === 'paused'`: offline with the retry held.
  isPaused: PropTypes.bool
};

export default FetchErrorState;
