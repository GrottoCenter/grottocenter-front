import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import {
  archiveConversationUrl,
  postMessageUrl,
  unarchiveConversationUrl
} from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { messageKeys } from '../../api/queryKeys';

// Every messaging mutation touches conversation lists, unread counts and the
// active thread — invalidate the whole domain and let RQ refetch whatever is
// mounted. Cheaper than the hand-written reducer patches it replaces.
const invalidateMessaging = queryClient =>
  queryClient.invalidateQueries({ queryKey: messageKeys.all });

export const useArchiveConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationId =>
      apiPost(archiveConversationUrl(conversationId)),
    onSuccess: () => invalidateMessaging(queryClient)
  });
};

export const useUnarchiveConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationId =>
      apiPost(unarchiveConversationUrl(conversationId)),
    onSuccess: () => invalidateMessaging(queryClient)
  });
};

// The API sometimes returns a message without an embedded caverSender object
// (just the id). Callers rely on `caverSender.nickname` to render the sent
// bubble, so hydrate from the decoded token when the server didn't. Reads
// login state at call time — a token appearing later still hydrates the
// next send correctly.
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const myCaver = useSelector(state => state.login.authTokenDecoded);
  return useMutation({
    mutationFn: async ({ conversationId, recipientId, body }) => {
      const payload = { body };
      if (conversationId) payload.conversationId = Number(conversationId);
      if (recipientId) payload.recipientId = Number(recipientId);
      const message = await apiPost(postMessageUrl, payload);
      if (message && typeof message.caverSender !== 'object') {
        message.caverSender = {
          id: Number(message.caverSender ?? myCaver?.id),
          nickname: myCaver?.nickname || 'Me'
        };
      }
      return message;
    },
    onSuccess: () => invalidateMessaging(queryClient)
  });
};
