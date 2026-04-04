import fetch from 'isomorphic-fetch';
import { readNotificationUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

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
      .then(checkAuthStatus(dispatch))
      .then(() => {
        dispatch(readNotificationActionSuccess());
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          readNotificationActionFailure(
            makeErrorMessage(
              error.message,
              `Reading notification with id ${notificationId}`
            ),
            error.message
          )
        );
      });
  };
}
