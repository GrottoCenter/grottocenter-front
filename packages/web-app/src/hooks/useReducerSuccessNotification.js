import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import REDUCER_STATUS from '../reducers/ReducerStatus';
import { useNotification } from './useNotification';

/**
 * Display a success notification with the message provided if the reducer status changed to "succeeded".
 * @param {REDUCER_STATUS} reducerStatus
 * @param {string} message
 */
export const useReducerSuccessNotification = (reducerStatus, message) => {
  const { formatMessage } = useIntl();
  const { onSuccess } = useNotification();
  const statusRef = useRef(reducerStatus);

  useEffect(() => {
    // Display the notification only if the status changed
    // This prevents the message to be shown again when coming back to a page where the reducer has already "SUCCEEDED" in the past
    const success =
      statusRef.current !== reducerStatus &&
      reducerStatus === REDUCER_STATUS.SUCCEEDED;
    if (success) {
      onSuccess(
        formatMessage({
          id: message
        })
      );
    }
    statusRef.current = reducerStatus;
  }, [formatMessage, message, onSuccess, reducerStatus, statusRef]);
};

useReducerSuccessNotification.PropTypes = {
  reducerStatus: PropTypes.oneOf(Object.values(REDUCER_STATUS)).isRequired,
  message: PropTypes.string.isRequired
};
