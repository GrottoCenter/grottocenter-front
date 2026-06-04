import {
  COUNT_UNREAD_MESSAGES,
  COUNT_UNREAD_MESSAGES_SUCCESS,
  COUNT_UNREAD_MESSAGES_FAILURE
} from '../actions/Messaging/CountUnreadMessages';
import {
  FETCH_CONVERSATIONS,
  FETCH_CONVERSATIONS_SUCCESS,
  FETCH_CONVERSATIONS_FAILURE
} from '../actions/Messaging/GetConversations';
import {
  FETCH_CONVERSATION_MESSAGES,
  FETCH_CONVERSATION_MESSAGES_SUCCESS,
  FETCH_CONVERSATION_MESSAGES_FAILURE
} from '../actions/Messaging/GetConversationMessages';
import {
  ARCHIVE_CONVERSATION_SUCCESS,
  ARCHIVE_CONVERSATION_FAILURE
} from '../actions/Messaging/ArchiveConversation';
import {
  UNARCHIVE_CONVERSATION_SUCCESS,
  UNARCHIVE_CONVERSATION_FAILURE
} from '../actions/Messaging/UnarchiveConversation';
import {
  SEND_MESSAGE_SUCCESS
} from '../actions/Messaging/SendMessage';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  unreadCounts: {
    active: 0,
    archived: 0,
    status: REDUCER_STATUS.IDLE,
    error: null
  },
  activeConversations: {
    items: [],
    totalCount: 0,
    status: REDUCER_STATUS.IDLE,
    error: null
  },
  archivedConversations: {
    items: [],
    totalCount: 0,
    status: REDUCER_STATUS.IDLE,
    error: null
  },
  activeConversationMessages: {
    items: [],
    totalCount: 0,
    status: REDUCER_STATUS.IDLE,
    error: null
  }
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case COUNT_UNREAD_MESSAGES:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          status: REDUCER_STATUS.LOADING,
          error: null
        }
      };
    case COUNT_UNREAD_MESSAGES_SUCCESS:
      return {
        ...state,
        unreadCounts: {
          active: action.activeCount,
          archived: action.archivedCount,
          status: REDUCER_STATUS.SUCCEEDED,
          error: null
        }
      };
    case COUNT_UNREAD_MESSAGES_FAILURE:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          status: REDUCER_STATUS.FAILED,
          error: action.error
        }
      };
    case FETCH_CONVERSATIONS: {
      const listKey = action.isArchived ? 'archivedConversations' : 'activeConversations';
      return {
        ...state,
        [listKey]: {
          ...state[listKey],
          status: REDUCER_STATUS.LOADING,
          error: null
        }
      };
    }
    case FETCH_CONVERSATIONS_SUCCESS: {
      const listKey = action.isArchived ? 'archivedConversations' : 'activeConversations';
      return {
        ...state,
        [listKey]: {
          items: action.conversations,
          totalCount: action.totalCount,
          status: REDUCER_STATUS.SUCCEEDED,
          error: null
        }
      };
    }
    case FETCH_CONVERSATIONS_FAILURE: {
      const listKey = action.isArchived ? 'archivedConversations' : 'activeConversations';
      return {
        ...state,
        [listKey]: {
          ...state[listKey],
          status: REDUCER_STATUS.FAILED,
          error: action.error
        }
      };
    }
    case FETCH_CONVERSATION_MESSAGES:
      return {
        ...state,
        activeConversationMessages: {
          ...state.activeConversationMessages,
          items: action.skip > 0 ? state.activeConversationMessages.items : [],
          status: REDUCER_STATUS.LOADING,
          error: null
        }
      };
    case FETCH_CONVERSATION_MESSAGES_SUCCESS: {
      const convId = Number(action.conversationId);
      const skip = action.skip || 0;

      const activeConv = state.activeConversations.items.find(c => c.id === convId);
      const archivedConv = state.archivedConversations.items.find(c => c.id === convId);

      const unreadCountToClear = activeConv ? activeConv.unreadCount : (archivedConv ? archivedConv.unreadCount : 0);

      const activeListItems = state.activeConversations.items.map(c =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      );

      const archivedListItems = state.archivedConversations.items.map(c =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      );

      const newItems = skip > 0
        ? [...action.messages, ...state.activeConversationMessages.items]
        : action.messages;

      return {
        ...state,
        activeConversations: {
          ...state.activeConversations,
          items: activeListItems
        },
        archivedConversations: {
          ...state.archivedConversations,
          items: archivedListItems
        },
        activeConversationMessages: {
          items: newItems,
          totalCount: action.totalCount,
          status: REDUCER_STATUS.SUCCEEDED,
          error: null
        },
        unreadCounts: {
          ...state.unreadCounts,
          active: activeConv ? Math.max(0, state.unreadCounts.active - unreadCountToClear) : state.unreadCounts.active,
          archived: archivedConv ? Math.max(0, state.unreadCounts.archived - unreadCountToClear) : state.unreadCounts.archived
        }
      };
    }
    case FETCH_CONVERSATION_MESSAGES_FAILURE:
      return {
        ...state,
        activeConversationMessages: {
          ...state.activeConversationMessages,
          status: REDUCER_STATUS.FAILED,
          error: action.error
        }
      };
    case ARCHIVE_CONVERSATION_SUCCESS: {
      const removedConv = state.activeConversations.items.find(c => c.id === action.conversationId);
      const unreadCountToMove = removedConv ? removedConv.unreadCount : 0;
      return {
        ...state,
        activeConversations: {
          ...state.activeConversations,
          items: state.activeConversations.items.filter(c => c.id !== action.conversationId),
          totalCount: Math.max(0, state.activeConversations.totalCount - 1),
          error: null
        },
        unreadCounts: {
          ...state.unreadCounts,
          active: Math.max(0, state.unreadCounts.active - unreadCountToMove),
          archived: state.unreadCounts.archived + unreadCountToMove
        }
      };
    }
    case ARCHIVE_CONVERSATION_FAILURE: {
      const { conversation, error } = action;
      if (!conversation) {
        return {
          ...state,
          activeConversations: {
            ...state.activeConversations,
            status: REDUCER_STATUS.FAILED,
            error
          }
        };
      }
      return {
        ...state,
        activeConversations: {
          items: [...state.activeConversations.items, conversation],
          totalCount: state.activeConversations.totalCount + 1,
          status: REDUCER_STATUS.FAILED,
          error
        },
        unreadCounts: {
          ...state.unreadCounts,
          active: state.unreadCounts.active + conversation.unreadCount,
          archived: Math.max(0, state.unreadCounts.archived - conversation.unreadCount)
        }
      };
    }
    case UNARCHIVE_CONVERSATION_SUCCESS: {
      const removedConv = state.archivedConversations.items.find(c => c.id === action.conversationId);
      const unreadCountToMove = removedConv ? removedConv.unreadCount : 0;
      return {
        ...state,
        archivedConversations: {
          ...state.archivedConversations,
          items: state.archivedConversations.items.filter(c => c.id !== action.conversationId),
          totalCount: Math.max(0, state.archivedConversations.totalCount - 1),
          error: null
        },
        unreadCounts: {
          ...state.unreadCounts,
          archived: Math.max(0, state.unreadCounts.archived - unreadCountToMove),
          active: state.unreadCounts.active + unreadCountToMove
        }
      };
    }
    case UNARCHIVE_CONVERSATION_FAILURE: {
      const { conversation, error } = action;
      if (!conversation) {
        return {
          ...state,
          archivedConversations: {
            ...state.archivedConversations,
            status: REDUCER_STATUS.FAILED,
            error
          }
        };
      }
      return {
        ...state,
        archivedConversations: {
          items: [...state.archivedConversations.items, conversation],
          totalCount: state.archivedConversations.totalCount + 1,
          status: REDUCER_STATUS.FAILED,
          error
        },
        unreadCounts: {
          ...state.unreadCounts,
          archived: state.unreadCounts.archived + conversation.unreadCount,
          active: Math.max(0, state.unreadCounts.active - conversation.unreadCount)
        }
      };
    }
    case SEND_MESSAGE_SUCCESS: {
      const { message, recipient } = action;
      const convId = Number(message.conversation);

      const currentConversationId = state.activeConversationMessages.items[0]?.conversation;
      const isCurrentConversation =
        currentConversationId !== undefined &&
        Number(currentConversationId) === convId;

      const updatedMessages = isCurrentConversation
        ? [...state.activeConversationMessages.items, message]
        : state.activeConversationMessages.items;

      const updatedTotalCount = isCurrentConversation
        ? state.activeConversationMessages.totalCount + 1
        : state.activeConversationMessages.totalCount;

      const updateConversationItem = c => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessage: message
          };
        }
        return c;
      };

      let activeItems = state.activeConversations.items.map(updateConversationItem);
      let newTotalCount = state.activeConversations.totalCount;

      const exists = state.activeConversations.items.some(c => c.id === convId);
      if (!exists && recipient) {
        const newConversationItem = {
          id: convId,
          dateInscription: message.dateSent || new Date().toISOString(),
          lastMessage: message,
          unreadCount: 0,
          otherParticipant: recipient,
          archivedAt: null
        };
        activeItems = [newConversationItem, ...activeItems];
        newTotalCount += 1;
      }

      const archivedItems = state.archivedConversations.items.map(updateConversationItem);

      return {
        ...state,
        activeConversationMessages: {
          ...state.activeConversationMessages,
          items: updatedMessages,
          totalCount: updatedTotalCount
        },
        activeConversations: {
          ...state.activeConversations,
          items: activeItems,
          totalCount: newTotalCount
        },
        archivedConversations: {
          ...state.archivedConversations,
          items: archivedItems
        }
      };
    }
    default:
      return state;
  }
};

export default reducer;
