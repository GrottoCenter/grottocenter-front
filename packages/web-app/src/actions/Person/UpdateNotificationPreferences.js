import fetch from 'isomorphic-fetch';
import { updateNotificationPreferencesUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const UPDATE_NOTIFICATION_PREFERENCES = 'UPDATE_NOTIFICATION_PREFERENCES';
export const UPDATE_NOTIFICATION_PREFERENCES_SUCCESS = 'UPDATE_NOTIFICATION_PREFERENCES_SUCCESS';
export const UPDATE_NOTIFICATION_PREFERENCES_FAILURE = 'UPDATE_NOTIFICATION_PREFERENCES_FAILURE';

export function updateNotificationPreferences(preferences) {
  return async (dispatch, getState) => {
    dispatch({ type: UPDATE_NOTIFICATION_PREFERENCES });

    try {
      const response = await checkAuthStatus(dispatch)(
        await fetch(updateNotificationPreferencesUrl, {
          method: 'PATCH',
          headers: {
            ...getState().login.authorizationHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(preferences)
        })
      );
      const data = await response.json();
      dispatch({ type: UPDATE_NOTIFICATION_PREFERENCES_SUCCESS, preferences: data });
    } catch (error) {
      if (error.isAuthError) return;
      dispatch({
        type: UPDATE_NOTIFICATION_PREFERENCES_FAILURE,
        error: error.body || makeErrorMessage(error.message, 'Updating notification preferences')
      });
    }
  };
}
