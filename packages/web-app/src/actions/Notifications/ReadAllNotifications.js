import fetch from 'isomorphic-fetch';
import { readAllNotificationsUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const READ_ALL_NOTIFICATIONS = 'READ_ALL_NOTIFICATIONS';
export const READ_ALL_NOTIFICATIONS_SUCCESS = 'READ_ALL_NOTIFICATIONS_SUCCESS';
export const READ_ALL_NOTIFICATIONS_FAILURE = 'READ_ALL_NOTIFICATIONS_FAILURE';

export const readAllNotificationsAction = () => ({
  type: READ_ALL_NOTIFICATIONS
});

export const readAllNotificationsActionSuccess = () => ({
  type: READ_ALL_NOTIFICATIONS_SUCCESS
});

export const readAllNotificationsActionFailure = error => ({
  type: READ_ALL_NOTIFICATIONS_FAILURE,
  error
});

export function readAllNotifications() {
  return (dispatch, getState) => {
    dispatch(readAllNotificationsAction());

    const requestOptions = {
      method: 'PUT',
      headers: getState().login.authorizationHeader
    };

    return fetch(readAllNotificationsUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(() => {
        dispatch(readAllNotificationsActionSuccess());
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          readAllNotificationsActionFailure(
            makeErrorMessage(error.message, 'Reading all notifications')
          )
        );
      });
  };
}
