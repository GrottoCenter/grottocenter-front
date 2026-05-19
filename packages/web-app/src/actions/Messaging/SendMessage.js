import fetch from 'isomorphic-fetch';
import { postMessageUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const SEND_MESSAGE_SUCCESS = 'SEND_MESSAGE_SUCCESS';

export function sendMessage({ conversationId, recipientId, body }) {
  return async (dispatch, getState) => {
    try {
      const payload = {};
      if (conversationId) payload.conversationId = Number(conversationId);
      if (recipientId) payload.recipientId = Number(recipientId);
      payload.body = body;

      const response = await checkAuthStatus(dispatch)(
        await fetch(postMessageUrl, {
          method: 'POST',
          headers: {
            ...getState().login.authorizationHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      );
      const message = await response.json();
      if (message && typeof message.caverSender !== 'object') {
        const myCaver = getState().login.authTokenDecoded;
        message.caverSender = {
          id: Number(message.caverSender || myCaver?.id),
          nickname: myCaver?.nickname || 'Me'
        };
      }
      dispatch({ type: SEND_MESSAGE_SUCCESS, message });
      return message;
    } catch (error) {
      console.error('Sending message failed:', error);
      throw error;
    }
  };
}
