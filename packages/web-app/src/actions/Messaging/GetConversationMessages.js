import fetch from 'isomorphic-fetch';
import { getConversationMessagesUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus, getTotalCount, makeUrl } from '../utils';

export const FETCH_CONVERSATION_MESSAGES = 'FETCH_CONVERSATION_MESSAGES';
export const FETCH_CONVERSATION_MESSAGES_SUCCESS =
  'FETCH_CONVERSATION_MESSAGES_SUCCESS';
export const FETCH_CONVERSATION_MESSAGES_FAILURE =
  'FETCH_CONVERSATION_MESSAGES_FAILURE';

const fetchConversationMessagesAction = skip => ({
  type: FETCH_CONVERSATION_MESSAGES,
  skip
});

const fetchConversationMessagesActionSuccess = (
  messages,
  totalCount,
  conversationId,
  skip
) => ({
  type: FETCH_CONVERSATION_MESSAGES_SUCCESS,
  messages,
  totalCount,
  conversationId,
  skip
});

const fetchConversationMessagesActionFailure = error => ({
  type: FETCH_CONVERSATION_MESSAGES_FAILURE,
  error
});

/**
 * Fetch messages for a specific conversation.
 * @param {number|string} conversationId - The conversation ID
 * @param {Object} criterias - Pagination criteria (limit, offset)
 */
export function fetchConversationMessages(conversationId, criterias) {
  return async (dispatch, getState) => {
    const skip = criterias?.skip || 0;
    dispatch(fetchConversationMessagesAction(skip));

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    try {
      const response = await checkAuthStatus(dispatch)(
        await fetch(
          makeUrl(getConversationMessagesUrl(conversationId), criterias),
          requestOptions
        )
      );

      const data = await response.json();
      const contentRangeHeader = response.headers.get('Content-Range');

      return dispatch(
        fetchConversationMessagesActionSuccess(
          data.messages,
          getTotalCount(data.messages.length, contentRangeHeader),
          conversationId,
          skip
        )
      );
    } catch (error) {
      if (error.isAuthError) return;
      return dispatch(
        fetchConversationMessagesActionFailure(
          error.body ||
            makeErrorMessage(error.message, `Fetching conversation messages`)
        )
      );
    }
  };
}
