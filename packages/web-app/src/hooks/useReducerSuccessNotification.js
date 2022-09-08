import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import REDUCER_STATUS from '../reducers/ReducerStatus';
import { useNotification } from './useNotification';

/**
 * Display a success notification with the message provided if the reducer status is "succeeded".
 * @param {REDUCER_STATUS} reducerStatus
 * @param {string} message
 */
export const useReducerSuccessNotification = (reducerStatus, message) => {
  const { formatMessage } = useIntl();
  const { onSuccess } = useNotification();
  useEffect(() => {
    const success = reducerStatus === REDUCER_STATUS.SUCCEEDED;
    if (success) {
      onSuccess(
        formatMessage({
          id: message
        })
      );
    }
  }, [formatMessage, message, onSuccess, reducerStatus]);
};

useReducerSuccessNotification.PropTypes = {
  reducerStatus: PropTypes.oneOf(Object.values(REDUCER_STATUS)).isRequired,
  message: PropTypes.string.isRequired
};
