import fetch from 'isomorphic-fetch';
import { countUnreadMessagesUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const COUNT_UNREAD_MESSAGES = 'COUNT_UNREAD_MESSAGES';
export const COUNT_UNREAD_MESSAGES_SUCCESS = 'COUNT_UNREAD_MESSAGES_SUCCESS';
export const COUNT_UNREAD_MESSAGES_FAILURE = 'COUNT_UNREAD_MESSAGES_FAILURE';

const countUnreadMessagesAction = () => ({
  type: COUNT_UNREAD_MESSAGES
});

const countUnreadMessagesActionSuccess = (activeCount, archivedCount) => ({
  type: COUNT_UNREAD_MESSAGES_SUCCESS,
  activeCount,
  archivedCount
});

const countUnreadMessagesActionFailure = error => ({
  type: COUNT_UNREAD_MESSAGES_FAILURE,
  error
});

/**
 * Fetch the unread message counts (active and archived) for the authenticated user.
 */
export function fetchUnreadMessageCount() {
  return async (dispatch, getState) => {
    dispatch(countUnreadMessagesAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    try {
      const response = await checkAuthStatus(dispatch)(
        await fetch(countUnreadMessagesUrl, requestOptions)
      );

      const data = await response.json();

      return dispatch(
        countUnreadMessagesActionSuccess(data.active, data.archived)
      );
    } catch (error) {
      if (error.isAuthError) return;
      return dispatch(
        countUnreadMessagesActionFailure(
          makeErrorMessage(error.message, `Counting unread messages`)
        )
      );
    }
  };
}
