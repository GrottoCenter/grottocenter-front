import fetch from 'isomorphic-fetch';
import { unarchiveConversationUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const UNARCHIVE_CONVERSATION_SUCCESS = 'UNARCHIVE_CONVERSATION_SUCCESS';
export const UNARCHIVE_CONVERSATION_FAILURE = 'UNARCHIVE_CONVERSATION_FAILURE';

export function unarchiveConversation(conversationId) {
  return async (dispatch, getState) => {
    // Find the conversation to revert it in case of failure
    const conversation = getState().messaging.archivedConversations.items.find(
      c => c.id === conversationId
    );

    // Optimistically update
    dispatch({ type: UNARCHIVE_CONVERSATION_SUCCESS, conversationId });

    try {
      await checkAuthStatus(dispatch)(
        await fetch(unarchiveConversationUrl(conversationId), {
          method: 'POST',
          headers: getState().login.authorizationHeader
        })
      );
    } catch (error) {
      console.error('Unarchiving conversation failed:', error);
      dispatch({
        type: UNARCHIVE_CONVERSATION_FAILURE,
        conversationId,
        conversation,
        error: error.body || { message: error.message || 'Unarchiving conversation failed' }
      });
    }
  };
}
