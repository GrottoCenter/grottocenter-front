import fetch from 'isomorphic-fetch';
import { fetchNotificationsUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus, getTotalCount, makeUrl } from '../utils';

export const FETCH_NOTIFICATIONS = 'FETCH_NOTIFICATIONS';
export const FETCH_NOTIFICATIONS_SUCCESS = 'FETCH_NOTIFICATIONS_SUCCESS';
export const FETCH_NOTIFICATIONS_FAILURE = 'FETCH_NOTIFICATIONS_FAILURE';

export const fetchNotificationsAction = () => ({
  type: FETCH_NOTIFICATIONS
});

export const fetchNotificationsActionSuccess = (notifications, totalCount) => ({
  type: FETCH_NOTIFICATIONS_SUCCESS,
  notifications,
  totalCount
});

export const fetchNotificationsActionFailure = error => ({
  type: FETCH_NOTIFICATIONS_FAILURE,
  error
});

export function fetchNotifications(criterias) {
  return async (dispatch, getState) => {
    dispatch(fetchNotificationsAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    try {
      const response = checkAndGetStatus(
        await fetch(makeUrl(fetchNotificationsUrl, criterias), requestOptions)
      );

      const data = await response.json();
      const contentRangeHeader = response.headers.get('Content-Range');

      return dispatch(
        fetchNotificationsActionSuccess(
          data.notifications,
          getTotalCount(data.notifications.length, contentRangeHeader)
        )
      );
    } catch (error) {
      return dispatch(
        fetchNotificationsActionFailure(
          makeErrorMessage(error.message, `Fetching user notifications`),
          error.message
        )
      );
    }
  };
}
