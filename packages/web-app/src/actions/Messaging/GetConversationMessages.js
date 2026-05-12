import fetch from 'isomorphic-fetch';
import { getConversationMessagesUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus, getTotalCount, makeUrl } from '../utils';

export const FETCH_CONVERSATION_MESSAGES = 'FETCH_CONVERSATION_MESSAGES';
export const FETCH_CONVERSATION_MESSAGES_SUCCESS = 'FETCH_CONVERSATION_MESSAGES_SUCCESS';
export const FETCH_CONVERSATION_MESSAGES_FAILURE = 'FETCH_CONVERSATION_MESSAGES_FAILURE';

const fetchConversationMessagesAction = () => ({
  type: FETCH_CONVERSATION_MESSAGES
});

const fetchConversationMessagesActionSuccess = (messages, totalCount) => ({
  type: FETCH_CONVERSATION_MESSAGES_SUCCESS,
  messages,
  totalCount
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
    dispatch(fetchConversationMessagesAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    try {
      const response = await checkAuthStatus(dispatch)(
        await fetch(makeUrl(getConversationMessagesUrl(conversationId), criterias), requestOptions)
      );

      const data = await response.json();
      const contentRangeHeader = response.headers.get('Content-Range');

      return dispatch(
        fetchConversationMessagesActionSuccess(
          data.messages,
          getTotalCount(data.messages.length, contentRangeHeader)
        )
      );
    } catch (error) {
      if (error.isAuthError) return;
      return dispatch(
        fetchConversationMessagesActionFailure(
          makeErrorMessage(error.message, `Fetching conversation messages`)
        )
      );
    }
  };
}
