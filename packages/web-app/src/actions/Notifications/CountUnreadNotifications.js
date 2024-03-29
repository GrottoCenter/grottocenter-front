import fetch from 'isomorphic-fetch';
import { countUnreadNotificationsUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';
import { logout } from '../Login';

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
      .catch(error => {
        // When logged, countUnreadNotifications() is the first authenticated request made to the API
        // So it is the first request that test if the JWT is really valid
        // In case of invalid token we logout the user
        if (error.message === '401') {
          dispatch(logout());
          return;
        }

        dispatch(
          countUnreadNotificationsActionFailure(
            makeErrorMessage(error.message, `Counting unread notifications`),
            error.message
          )
        );
      });
  };
}
