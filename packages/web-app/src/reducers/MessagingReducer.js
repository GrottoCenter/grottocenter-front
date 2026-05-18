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
  ARCHIVE_CONVERSATION_SUCCESS
} from '../actions/Messaging/ArchiveConversation';
import {
  UNARCHIVE_CONVERSATION_SUCCESS
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
          status: REDUCER_STATUS.LOADING,
          error: null
        }
      };
    case FETCH_CONVERSATION_MESSAGES_SUCCESS: {
      const convId = Number(action.conversationId);

      const activeConv = state.activeConversations.items.find(c => c.id === convId);
      const archivedConv = state.archivedConversations.items.find(c => c.id === convId);

      const unreadCountToClear = activeConv ? activeConv.unreadCount : (archivedConv ? archivedConv.unreadCount : 0);

      const activeListItems = state.activeConversations.items.map(c =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      );

      const archivedListItems = state.archivedConversations.items.map(c =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      );

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
          items: action.messages,
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
          totalCount: Math.max(0, state.activeConversations.totalCount - 1)
        },
        unreadCounts: {
          ...state.unreadCounts,
          active: Math.max(0, state.unreadCounts.active - unreadCountToMove),
          archived: state.unreadCounts.archived + unreadCountToMove
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
          totalCount: Math.max(0, state.archivedConversations.totalCount - 1)
        },
        unreadCounts: {
          ...state.unreadCounts,
          archived: Math.max(0, state.unreadCounts.archived - unreadCountToMove),
          active: state.unreadCounts.active + unreadCountToMove
        }
      };
    }
    case SEND_MESSAGE_SUCCESS: {
      const { message } = action;
      const convId = Number(message.conversation);

      const updatedMessages = [...state.activeConversationMessages.items, message];

      const updateConversationItem = c => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessage: message
          };
        }
        return c;
      };

      const activeItems = state.activeConversations.items.map(updateConversationItem);
      const archivedItems = state.archivedConversations.items.map(updateConversationItem);

      return {
        ...state,
        activeConversationMessages: {
          ...state.activeConversationMessages,
          items: updatedMessages,
          totalCount: state.activeConversationMessages.totalCount + 1
        },
        activeConversations: {
          ...state.activeConversations,
          items: activeItems
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
