import { useQuery } from '@tanstack/react-query';

import {
  countUnreadMessagesUrl,
  getArchivedConversationsUrl,
  getConversationsUrl,
  getConversationMessagesUrl
} from '../../conf/apiRoutes';
import { apiGet, apiGetWithRange } from '../../api/client';
import { messageKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';
import { getTotalCount, makeUrl } from '../../actions/utils';

const selectPaginated =
  pluckKey =>
  ({ data, contentRange }) => ({
    items: data?.[pluckKey] ?? [],
    totalCount: getTotalCount(data?.[pluckKey]?.length ?? 0, contentRange)
  });

const selectConversations = selectPaginated('conversations');
const selectMessages = selectPaginated('messages');

/**
 * Paginated conversation list. The two tabs (active / archived) hit different
 * endpoints; each pagination cursor caches under its own queryKey so switching
 * tabs is instant when the previous page is still fresh.
 */
export const useConversations = ({
  isArchived = false,
  page = 1,
  pageSize
} = {}) => {
  const criteria = { limit: pageSize, skip: (page - 1) * pageSize };
  const baseUrl = isArchived
    ? getArchivedConversationsUrl
    : getConversationsUrl;
  return useQuery({
    queryKey: messageKeys.conversations({ isArchived, page, pageSize }),
    queryFn: () => apiGetWithRange(makeUrl(baseUrl, criteria)),
    select: selectConversations,
    staleTime: STALE.VOLATILE
  });
};

/**
 * One page of a conversation's messages. The legacy reducer accumulated older
 * messages as the user scrolled up (skip grew) — RQ keeps each page cached
 * independently, and the consumer flattens them via useQueries or by keeping
 * the accumulated array in local state. The current consumer uses local
 * state to accumulate, so this hook just exposes one skip at a time.
 */
export const useConversationMessages = (
  conversationId,
  { skip = 0, pageSize } = {}
) =>
  useQuery({
    queryKey: messageKeys.messages(conversationId, { skip, pageSize }),
    queryFn: () =>
      apiGetWithRange(
        makeUrl(getConversationMessagesUrl(conversationId), {
          limit: pageSize,
          skip
        })
      ),
    enabled: Boolean(conversationId),
    select: selectMessages,
    staleTime: STALE.VOLATILE
  });

/**
 * Unread message badge counter. Volatile: a stale badge silently masks new
 * messages, which is the one thing the badge exists to reveal.
 */
export const useUnreadMessageCount = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: messageKeys.unreadCount(),
    queryFn: async () => {
      const data = await apiGet(countUnreadMessagesUrl);
      return {
        active: data?.active ?? 0,
        archived: data?.archived ?? 0
      };
    },
    enabled,
    staleTime: STALE.VOLATILE
  });
