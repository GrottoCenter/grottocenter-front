import fetch from 'isomorphic-fetch';
import { fetchNotificationsUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';

export const FETCH_NOTIFICATIONS = 'FETCH_NOTIFICATIONS';
export const FETCH_NOTIFICATIONS_SUCCESS = 'FETCH_NOTIFICATIONS_SUCCESS';
export const FETCH_NOTIFICATIONS_FAILURE = 'FETCH_NOTIFICATIONS_FAILURE';

export const fetchNotificationsAction = () => ({
  type: FETCH_NOTIFICATIONS
});

export const fetchNotificationsActionSuccess = notifications => ({
  type: FETCH_NOTIFICATIONS_SUCCESS,
  notifications
});

export const fetchNotificationsActionFailure = error => ({
  type: FETCH_NOTIFICATIONS_FAILURE,
  error
});

export function fetchNotifications() {
  return (dispatch, getState) => {
    dispatch(fetchNotificationsAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(fetchNotificationsUrl, requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        dispatch(fetchNotificationsActionSuccess(data.notifications));
      })
      .catch(error =>
        dispatch(
          fetchNotificationsActionFailure(
            makeErrorMessage(error.message, `Fetching user notifications`),
            error.message
          )
        )
      );
  };
}
