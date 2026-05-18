import fetch from 'isomorphic-fetch';
import { archiveConversationUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const ARCHIVE_CONVERSATION_SUCCESS = 'ARCHIVE_CONVERSATION_SUCCESS';

export function archiveConversation(conversationId) {
  return async (dispatch, getState) => {
    try {
      await checkAuthStatus(dispatch)(
        await fetch(archiveConversationUrl(conversationId), {
          method: 'POST',
          headers: getState().login.authorizationHeader
        })
      );
      dispatch({ type: ARCHIVE_CONVERSATION_SUCCESS, conversationId });
    } catch (error) {
      console.error('Archiving conversation failed:', error);
    }
  };
}
