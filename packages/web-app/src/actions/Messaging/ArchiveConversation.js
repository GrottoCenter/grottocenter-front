import fetch from 'isomorphic-fetch';
import { archiveConversationUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const ARCHIVE_CONVERSATION_SUCCESS = 'ARCHIVE_CONVERSATION_SUCCESS';
export const ARCHIVE_CONVERSATION_FAILURE = 'ARCHIVE_CONVERSATION_FAILURE';

export function archiveConversation(conversationId) {
  return async (dispatch, getState) => {
    // Find the conversation to revert it in case of failure
    const conversation = getState().messaging.activeConversations.items.find(
      c => c.id === conversationId
    );

    // Optimistically update
    dispatch({ type: ARCHIVE_CONVERSATION_SUCCESS, conversationId });

    try {
      await checkAuthStatus(dispatch)(
        await fetch(archiveConversationUrl(conversationId), {
          method: 'POST',
          headers: getState().login.authorizationHeader
        })
      );
    } catch (error) {
      if (error.isAuthError) return;
      console.error('Archiving conversation failed:', error);
      dispatch({
        type: ARCHIVE_CONVERSATION_FAILURE,
        conversationId,
        conversation,
        error: error.body || {
          message: error.message || 'Archiving conversation failed'
        }
      });
    }
  };
}
