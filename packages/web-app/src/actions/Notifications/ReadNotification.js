import fetch from 'isomorphic-fetch';
import { readNotificationUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';

export const READ_NOTIFICATION = 'READ_NOTIFICATION';
export const READ_NOTIFICATION_SUCCESS = 'READ_NOTIFICATION_SUCCESS';
export const READ_NOTIFICATION_FAILURE = 'READ_NOTIFICATION_FAILURE';

export const readNotificationAction = () => ({
  type: READ_NOTIFICATION
});

export const readNotificationActionSuccess = () => ({
  type: READ_NOTIFICATION_SUCCESS
});

export const readNotificationActionFailure = error => ({
  type: READ_NOTIFICATION_FAILURE,
  error
});

export function readNotification(notificationId) {
  return (dispatch, getState) => {
    dispatch(readNotificationAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(readNotificationUrl(notificationId), requestOptions)
      .then(checkAndGetStatus)
      .then(() => {
        dispatch(readNotificationActionSuccess());
      })
      .catch(error =>
        dispatch(
          readNotificationActionFailure(
            makeErrorMessage(
              error.message,
              `Reading notification with id ${notificationId}`
            ),
            error.message
          )
        )
      );
  };
}
