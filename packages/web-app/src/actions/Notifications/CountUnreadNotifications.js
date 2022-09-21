import fetch from 'isomorphic-fetch';
import { countUnreadNotificationsUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';

export const COUNT_UNREAD_NOTIFICATIONS = 'COUNT_UNREAD_NOTIFICATIONS';
export const COUNT_UNREAD_NOTIFICATIONS_SUCCESS =
  'COUNT_UNREAD_NOTIFICATIONS_SUCCESS';
export const COUNT_UNREAD_NOTIFICATIONS_FAILURE =
  'COUNT_UNREAD_NOTIFICATIONS_FAILURE';

export const countUnreadNotificationsAction = () => ({
  type: COUNT_UNREAD_NOTIFICATIONS
});

export const countUnreadNotificationsActionSuccess = count => ({
  type: COUNT_UNREAD_NOTIFICATIONS_SUCCESS,
  count
});

export const countUnreadNotificationsActionFailure = error => ({
  type: COUNT_UNREAD_NOTIFICATIONS_FAILURE,
  error
});

export function countUnreadNotifications() {
  return (dispatch, getState) => {
    dispatch(countUnreadNotificationsAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(countUnreadNotificationsUrl, requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        dispatch(countUnreadNotificationsActionSuccess(data.count));
      })
      .catch(error =>
        dispatch(
          countUnreadNotificationsActionFailure(
            makeErrorMessage(error.message, `Counting unread notifications`),
            error.message
          )
        )
      );
  };
}
