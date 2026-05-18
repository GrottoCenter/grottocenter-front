import fetch from 'isomorphic-fetch';
import { unarchiveConversationUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const UNARCHIVE_CONVERSATION_SUCCESS = 'UNARCHIVE_CONVERSATION_SUCCESS';

export function unarchiveConversation(conversationId) {
  return async (dispatch, getState) => {
    try {
      await checkAuthStatus(dispatch)(
        await fetch(unarchiveConversationUrl(conversationId), {
          method: 'POST',
          headers: getState().login.authorizationHeader
        })
      );
      dispatch({ type: UNARCHIVE_CONVERSATION_SUCCESS, conversationId });
    } catch (error) {
      console.error('Unarchiving conversation failed:', error);
    }
  };
}
