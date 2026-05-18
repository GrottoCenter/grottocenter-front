import fetch from 'isomorphic-fetch';
import { getNotificationPreferencesUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const GET_NOTIFICATION_PREFERENCES = 'GET_NOTIFICATION_PREFERENCES';
export const GET_NOTIFICATION_PREFERENCES_SUCCESS = 'GET_NOTIFICATION_PREFERENCES_SUCCESS';
export const GET_NOTIFICATION_PREFERENCES_FAILURE = 'GET_NOTIFICATION_PREFERENCES_FAILURE';

export function getNotificationPreferences() {
  return async (dispatch, getState) => {
    dispatch({ type: GET_NOTIFICATION_PREFERENCES });

    try {
      const response = await checkAuthStatus(dispatch)(
        await fetch(getNotificationPreferencesUrl, {
          method: 'GET',
          headers: getState().login.authorizationHeader
        })
      );
      const data = await response.json();
      dispatch({ type: GET_NOTIFICATION_PREFERENCES_SUCCESS, preferences: data });
    } catch (error) {
      if (error.isAuthError) return;
      dispatch({
        type: GET_NOTIFICATION_PREFERENCES_FAILURE,
        error: error.body || makeErrorMessage(error.message, 'Fetching notification preferences')
      });
    }
  };
}
