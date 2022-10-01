import fetch from 'isomorphic-fetch';
import { fetchNotificationsUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus, getTotalCount, makeUrl } from '../utils';

export const FETCH_MENU_NOTIFICATIONS = 'FETCH_MENU_NOTIFICATIONS';
export const FETCH_MENU_NOTIFICATIONS_SUCCESS =
  'FETCH_MENU_NOTIFICATIONS_SUCCESS';
export const FETCH_MENU_NOTIFICATIONS_FAILURE =
  'FETCH_MENU_NOTIFICATIONS_FAILURE';

export const fetchMenuNotificationsAction = () => ({
  type: FETCH_MENU_NOTIFICATIONS
});

export const fetchMenuNotificationsActionSuccess = (
  notifications,
  totalCount
) => ({
  type: FETCH_MENU_NOTIFICATIONS_SUCCESS,
  notifications,
  totalCount
});

export const fetchMenuNotificationsActionFailure = error => ({
  type: FETCH_MENU_NOTIFICATIONS_FAILURE,
  error
});

export function fetchMenuNotifications(criterias) {
  return async (dispatch, getState) => {
    dispatch(fetchMenuNotificationsAction());

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
        fetchMenuNotificationsActionSuccess(
          data.notifications,
          getTotalCount(data.notifications.length, contentRangeHeader)
        )
      );
    } catch (error) {
      return dispatch(
        fetchMenuNotificationsActionFailure(
          makeErrorMessage(error.message, `Fetching menu notifications`),
          error.message
        )
      );
    }
  };
}
