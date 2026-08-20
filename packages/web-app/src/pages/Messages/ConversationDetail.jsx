import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntl, FormattedDate } from 'react-intl';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  IconButton,
  Button,
  useMediaQuery
} from '@mui/material';
import Linkify from 'linkify-react';
import SendIcon from '@mui/icons-material/Send';
import FlagIcon from '@mui/icons-material/Flag';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled, alpha } from '@mui/material/styles';
import linkifyOptions from '../../helpers/linkifyOptions';
import UserAvatar from '../../components/common/UserAvatar';
import AppLink from '../../components/common/AppLink';

import FetchErrorState from '../../components/common/FetchErrorState';
import OfflineDisabled from '../../components/common/OfflineDisabled';
import StandardDialog from '../../components/common/StandardDialog';
import {
  useConversationMessages,
  useConversations,
  useLongPress,
  useNotification,
  useOnlineStatus,
  useSendMessage
} from '../../hooks';
import { messageKeys } from '../../api/queryKeys';

const MESSAGES_PAGE_SIZE = 20;
const GROUP_GAP_MS = 5 * 60 * 1000; // Consecutive messages within 5 min are grouped

const DetailContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  bgcolor: theme.palette.background.default
}));

const MessagesList = styled(List)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  minWidth: 0,
  padding: theme.spacing(1, 1.5),
  display: 'flex',
  flexDirection: 'column-reverse', // Shows latest at the bottom
  backgroundColor: theme.palette.background.paper
}));

// See StyledListItem in ./index.jsx: $-props must not reach the DOM.
const MessageBubble = styled(Paper, {
  shouldForwardProp: prop => !prop.startsWith('$')
})(({ theme, $isMine, $isFirstOfGroup, $isLastOfGroup }) => {
  const softMineBg = alpha(theme.palette.primary.main, 0.28);
  const theirsBg =
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[200];
  return {
    padding: theme.spacing(0.75, 1.25),
    maxWidth: '85%',
    minWidth: 0,
    width: 'fit-content',
    alignSelf: $isMine ? 'flex-end' : 'flex-start',
    backgroundColor: $isMine ? softMineBg : theirsBg,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing($isLastOfGroup ? 1.5 : 0.25),
    marginTop: $isFirstOfGroup ? theme.spacing(0.25) : 0,
    borderRadius: 16,
    // Tail on last of group, on sender's side
    borderBottomRightRadius: $isMine && $isLastOfGroup ? 4 : 16,
    borderBottomLeftRadius: !$isMine && $isLastOfGroup ? 4 : 16,
    boxShadow: `0 1px 0.5px ${alpha(theme.palette.common.black, 0.08)}`,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    position: 'relative',
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'underline'
    },
    '& .message-actions-trigger': {
      opacity: 0,
      transition: 'opacity 0.15s ease'
    },
    '@media (hover: hover)': {
      '&:hover .message-actions-trigger, & .message-actions-trigger:focus-visible':
        {
          opacity: 1
        }
    },
    // On touch devices the reveal-on-hover trick doesn't work; the long-press
    // gesture is the only way to open the menu, so hide the button entirely.
    // We also suppress iOS Safari's native text-selection callout, which would
    // otherwise pop up on the same long-press and compete with our own menu.
    '@media (hover: none)': {
      '& .message-actions-trigger': { display: 'none' },
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none'
    },
    [theme.breakpoints.up('sm')]: {
      maxWidth: '75%'
    }
  };
});

const MessageDate = styled(Box)(({ theme }) => ({
  fontSize: '0.6875rem',
  color: theme.palette.text.secondary,
  opacity: 0.7,
  marginTop: '2px',
  textAlign: 'right'
}));

const DaySeparatorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  margin: theme.spacing(1.5, 0, 1)
}));

const DaySeparatorChip = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  padding: theme.spacing(0.25, 1.25),
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  textTransform: 'capitalize',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.6875rem'
  }
}));

const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  paddingBottom: `max(${theme.spacing(1)}, env(safe-area-inset-bottom))`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25)
}));

const InputRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5)
}));

const RoundInput = styled(TextField)(({ theme }) => ({
  padding: 0,
  '& .MuiOutlinedInput-root': {
    borderRadius: '22px',
    backgroundColor: theme.palette.background.default,
    minHeight: 40,
    [theme.breakpoints.down('sm')]: {
      minHeight: 44
    }
  }
}));

const SendButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  flexShrink: 0,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': { backgroundColor: theme.palette.primary.dark },
  '&.Mui-disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled
  },
  [theme.breakpoints.down('sm')]: {
    width: 44,
    height: 44
  }
}));

const startOfDay = value => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildRenderedItems = (msgs, myCaverId) => {
  const items = [];
  let prevMsg = null;
  let prevDayKey = null;

  msgs.forEach(msg => {
    const dayKey = startOfDay(msg.dateSent).toISOString();
    if (dayKey !== prevDayKey) {
      items.push({
        type: 'separator',
        key: `sep-${dayKey}`,
        date: msg.dateSent
      });
      prevDayKey = dayKey;
      prevMsg = null;
    }
    const sameAuthor =
      prevMsg && prevMsg.caverSender?.id === msg.caverSender?.id;
    const timeGap = prevMsg
      ? new Date(msg.dateSent) - new Date(prevMsg.dateSent)
      : Infinity;
    const isFirstOfGroup = !sameAuthor || timeGap > GROUP_GAP_MS;
    items.push({
      type: 'message',
      key: msg.id,
      msg,
      isMine: msg.caverSender?.id === myCaverId,
      isFirstOfGroup,
      isLastOfGroup: false
    });
    prevMsg = msg;
  });

  for (let i = 0; i < items.length; i += 1) {
    if (items[i].type !== 'message') continue;
    const next = items[i + 1];
    if (!next || next.type === 'separator') {
      items[i].isLastOfGroup = true;
    } else {
      const sameAuthor =
        items[i].msg.caverSender?.id === next.msg.caverSender?.id;
      const timeGap =
        new Date(next.msg.dateSent) - new Date(items[i].msg.dateSent);
      items[i].isLastOfGroup = !sameAuthor || timeGap > GROUP_GAP_MS;
    }
  }
  return items;
};

const DaySeparator = ({ date }) => {
  const { formatMessage } = useIntl();
  const msgDay = startOfDay(date);
  const today = startOfDay(new Date());
  const diffDays = Math.round((msgDay - today) / 86400000);

  let content;
  if (diffDays === 0) {
    content = formatMessage({ id: 'Today', defaultMessage: 'Today' });
  } else if (diffDays === -1) {
    content = formatMessage({ id: 'Yesterday', defaultMessage: 'Yesterday' });
  } else {
    content = (
      <FormattedDate value={date} year="numeric" month="long" day="2-digit" />
    );
  }
  return (
    <DaySeparatorContainer>
      <DaySeparatorChip variant="caption">{content}</DaySeparatorChip>
    </DaySeparatorContainer>
  );
};

DaySeparator.propTypes = {
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
    .isRequired
};

const MESSAGE_ACTIONS_MENU_ID = 'message-actions-menu';

const MessageItem = ({ item, isMenuOpen, onOpenMenu }) => {
  const { formatMessage } = useIntl();
  const { msg, isMine, isFirstOfGroup, isLastOfGroup } = item;

  const handleLongPress = useCallback(
    ({ x, y }) => {
      onOpenMenu(msg, { position: { top: y, left: x } });
    },
    [onOpenMenu, msg]
  );

  const longPress = useLongPress(handleLongPress);

  return (
    <MessageBubble
      elevation={0}
      $isMine={isMine}
      $isFirstOfGroup={isFirstOfGroup}
      $isLastOfGroup={isLastOfGroup}
      {...(isMine ? {} : longPress)}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 0.5
        }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            <Linkify options={linkifyOptions}>{msg.body}</Linkify>
          </Typography>
        </Box>
        {!isMine && (
          <IconButton
            className="message-actions-trigger"
            size="small"
            aria-label={formatMessage({
              id: 'Message actions',
              defaultMessage: 'Message actions'
            })}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-controls={isMenuOpen ? MESSAGE_ACTIONS_MENU_ID : undefined}
            onClick={e => onOpenMenu(msg, { anchor: e.currentTarget })}
            sx={{
              color: 'text.secondary',
              padding: 0.25,
              mt: '2px',
              flexShrink: 0
            }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <MessageDate>
        <FormattedDate value={msg.dateSent} hour="2-digit" minute="2-digit" />
      </MessageDate>
    </MessageBubble>
  );
};

MessageItem.propTypes = {
  item: PropTypes.shape({
    msg: PropTypes.shape({
      body: PropTypes.string,
      dateSent: PropTypes.string
    }).isRequired,
    isMine: PropTypes.bool.isRequired,
    isFirstOfGroup: PropTypes.bool.isRequired,
    isLastOfGroup: PropTypes.bool.isRequired
  }).isRequired,
  isMenuOpen: PropTypes.bool.isRequired,
  onOpenMenu: PropTypes.func.isRequired
};

const BlankStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  backgroundColor: theme.palette.action.hover,
  color: theme.palette.text.secondary,
  padding: theme.spacing(3),
  textAlign: 'center'
}));

const ConversationDetail = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatMessage } = useIntl();

  // Virtual keyboards have no usable Shift+Enter, so Enter must insert a line
  // break there and sending goes through the button only — as in every mobile
  // messaging app. Keyed on pointer type, not screen width: a narrow desktop
  // window still has a physical keyboard.
  const hasVirtualKeyboard = useMediaQuery('(pointer: coarse)');

  const [replyText, setReplyText] = useState('');
  const [selectedMessageToReport, setSelectedMessageToReport] = useState(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { onSuccess, onError } = useNotification();
  const isOnline = useOnlineStatus();

  // Skip-based pagination: `skip` grows as the user scrolls up. Each skip
  // maps to a distinct queryKey, so RQ caches every page independently and
  // switching threads keeps their scroll history warm.
  const [skip, setSkip] = useState(0);
  const [accumulated, setAccumulated] = useState([]);

  // Reset accumulation when navigating to a different conversation.
  useEffect(() => {
    setSkip(0);
    setAccumulated([]);
  }, [conversationId]);

  const {
    data: pageData,
    isFetching,
    isPending,
    isSuccess,
    error,
    refetch: refetchCurrentPage
  } = useConversationMessages(conversationId, {
    skip,
    pageSize: MESSAGES_PAGE_SIZE
  });

  // Prepend older pages, replace on the initial page. Guarded on isSuccess
  // to avoid flushing accumulated when the query is transitioning between
  // pages and pageData briefly reads the previous shape.
  useEffect(() => {
    if (!isSuccess || !pageData) return;
    setAccumulated(prev =>
      skip === 0 ? pageData.items : [...pageData.items, ...prev]
    );
  }, [pageData, skip, isSuccess]);

  // Opening a conversation marks its messages as read server-side; invalidate
  // the unread-count and conversation lists so the badges catch up. Ran once
  // per initial load per conversation (skip === 0 && isSuccess).
  useEffect(() => {
    if (skip === 0 && isSuccess) {
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount() });
      queryClient.invalidateQueries({
        queryKey: messageKeys.conversations({}),
        exact: false
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, skip === 0 && isSuccess]);

  const messages = accumulated;
  const totalCount = pageData?.totalCount ?? 0;

  const sendMessageMutation = useSendMessage();

  // Read the active conversation from the paged lists' cached data — the
  // otherParticipant lives on the conversation shape, not on individual
  // messages, and we want the same nickname/link as the sidebar shows.
  // getConversationsData combs both active and archived caches; the first
  // match wins.
  const { data: activeData } = useConversations({
    isArchived: false,
    page: 1,
    pageSize: 20
  });
  const { data: archivedData } = useConversations({
    isArchived: true,
    page: 1,
    pageSize: 20
  });
  const convIdNum = Number(conversationId);
  const currentConversation =
    activeData?.items?.find(c => c.id === convIdNum) ||
    archivedData?.items?.find(c => c.id === convIdNum);

  const authState = useSelector(state => state.login);
  const myCaverId = authState?.authTokenDecoded?.id;

  const renderedItems = useMemo(
    () => buildRenderedItems(messages, myCaverId).reverse(),
    [messages, myCaverId]
  );

  const [actionsMenu, setActionsMenu] = useState(null);
  const handleOpenActionsMenu = useCallback((msg, { anchor, position }) => {
    setActionsMenu({ msg, anchor: anchor || null, position: position || null });
  }, []);
  const handleCloseActionsMenu = useCallback(() => setActionsMenu(null), []);

  // Do NOT fall back on the last-visited profile: it holds no guaranteed link
  // to this conversation. Using it would render the wrong nickname and link
  // the header to an unrelated user (misattribution / data leak).
  const otherParticipant =
    currentConversation?.otherParticipant ||
    messages.find(m => m.caverSender?.id !== myCaverId)?.caverSender ||
    null;

  const titleText =
    otherParticipant?.nickname || formatMessage({ id: 'Conversation details' });

  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);
  const sentinelRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Gate hasMore on isSuccess: between conversations, accumulated resets to
  // [] but totalCount briefly holds the previous value, so a naive check
  // would spawn a duplicate skip=0 fetch that races the initial one.
  const hasMore = isSuccess && messages.length < totalCount;

  useEffect(() => {
    isFirstLoad.current = true;
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0 && isFirstLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isFirstLoad.current = false;
    }
  }, [messages]);

  const loadMore = useCallback(() => {
    if (isFetching || !hasMore) return;
    setSkip(messages.length);
  }, [isFetching, hasMore, messages.length]);

  useEffect(() => {
    if (!hasMore || isFetching) return undefined;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        root: messagesListRef.current,
        threshold: 0.1
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isFetching, loadMore]);

  if (!conversationId) {
    return (
      <BlankStateContainer>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {formatMessage({ id: 'Select a conversation to start messaging' })}
        </Typography>
      </BlankStateContainer>
    );
  }

  // Without `myCaverId`, `isMine` collapses to false for every message (own
  // bubbles rendered on the wrong side, long-press wired to them) and
  // `otherParticipant` may resolve to the current user. Wait for the token
  // to decode before rendering anything derived from it.
  if (!myCaverId) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isPending || (isFetching && messages.length === 0)) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <FetchErrorState
          error={error}
          onRetry={refetchCurrentPage}
          messageId="An error occurred while fetching messages."
        />
      </Box>
    );
  }

  const handleSend = async () => {
    if (!replyText.trim() || replyText.length > 5000) return;
    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        body: replyText.trim()
      });
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      onError(formatMessage({ id: 'Failed to send message.' }));
    }
  };

  const handleReportClick = msg => {
    setSelectedMessageToReport(msg);
    setIsReportDialogOpen(true);
  };

  const handleCloseReportDialog = () => {
    setIsReportDialogOpen(false);
    setSelectedMessageToReport(null);
  };

  const handleConfirmReport = async () => {
    if (!selectedMessageToReport) return;

    const senderName =
      selectedMessageToReport.caverSender?.nickname || 'Unknown';
    const body = selectedMessageToReport.body || '';
    const date = new Date(selectedMessageToReport.dateSent).toLocaleString();

    const textToCopy = `Message Report details:
Sender: ${senderName} (ID: ${selectedMessageToReport.caverSender?.id || 'Unknown'})
Date: ${date}
Message Body: ${body}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      onSuccess(
        formatMessage({
          id: 'Message details copied to clipboard.',
          defaultMessage: 'Message details copied to clipboard.'
        })
      );
      window.open(
        'https://en.wikicaves.org/contact',
        '_blank',
        'noopener,noreferrer'
      );
    } catch (err) {
      console.error('Failed to copy text to clipboard:', err);
      onError(
        formatMessage({
          id: 'Failed to copy message details to clipboard. Please copy them manually.',
          defaultMessage:
            'Failed to copy message details to clipboard. Please copy them manually.'
        })
      );
    }

    handleCloseReportDialog();
  };

  const isSending = sendMessageMutation.isPending;

  return (
    <DetailContainer>
      <Box
        sx={{
          p: 1,
          bgcolor: 'background.paper',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
        <IconButton
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            p: '6px'
          }}
          onClick={() => navigate('/ui/messages')}>
          <ArrowBackIcon />
        </IconButton>
        {otherParticipant && (
          <UserAvatar
            username={otherParticipant.nickname}
            color="primary"
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              width: 36,
              height: 36
            }}
          />
        )}
        <Typography variant="h3" component="h2">
          {otherParticipant ? (
            <AppLink
              to={`/ui/persons/${otherParticipant.id}`}
              sx={{ color: 'inherit', textDecoration: 'underline' }}>
              {titleText}
            </AppLink>
          ) : (
            titleText
          )}
        </Typography>
      </Box>
      <MessagesList ref={messagesListRef}>
        <div ref={messagesEndRef} />
        {renderedItems.map(item => {
          if (item.type === 'separator') {
            return <DaySeparator key={item.key} date={item.date} />;
          }
          return (
            <MessageItem
              key={item.key}
              item={item}
              isMenuOpen={actionsMenu?.msg.id === item.msg.id}
              onOpenMenu={handleOpenActionsMenu}
            />
          );
        })}
        {hasMore && (
          <Box
            ref={sentinelRef}
            sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
            {isFetching ? (
              <CircularProgress size={24} />
            ) : (
              <Button onClick={loadMore} size="small">
                {formatMessage({
                  id: 'Load more',
                  defaultMessage: 'Load more'
                })}
              </Button>
            )}
          </Box>
        )}
      </MessagesList>
      <InputArea>
        <OfflineDisabled fullWidth>
          <InputRow>
            <RoundInput
              fullWidth
              multiline
              maxRows={4}
              variant="outlined"
              disabled={!isOnline}
              placeholder={formatMessage({ id: 'Type a message...' })}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !hasVirtualKeyboard) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              slotProps={{
                htmlInput: {
                  maxLength: 5100,
                  enterKeyHint: hasVirtualKeyboard ? 'enter' : 'send'
                }
              }}
              error={replyText.length > 5000}
              size="small"
            />
            <SendButton
              onClick={handleSend}
              onMouseDown={e => e.preventDefault()}
              disabled={
                !isOnline ||
                !replyText.trim() ||
                replyText.length > 5000 ||
                isSending
              }>
              {isSending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon fontSize="small" />
              )}
            </SendButton>
          </InputRow>
        </OfflineDisabled>
        {replyText.length >= 4000 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              px: 1,
              color: replyText.length > 5000 ? 'error.main' : 'text.secondary',
              fontSize: '0.75rem'
            }}>
            {replyText.length > 5000 &&
              `${formatMessage({
                id: 'Message exceeds 5000 characters limit.',
                defaultMessage: 'Message exceeds 5000 characters limit.'
              })} `}
            {replyText.length} / 5000
          </Box>
        )}
      </InputArea>
      <Menu
        id={MESSAGE_ACTIONS_MENU_ID}
        open={Boolean(actionsMenu)}
        anchorEl={actionsMenu?.anchor || null}
        anchorReference={actionsMenu?.position ? 'anchorPosition' : 'anchorEl'}
        anchorPosition={actionsMenu?.position || undefined}
        onClose={handleCloseActionsMenu}>
        <MenuItem
          onClick={() => {
            const msg = actionsMenu?.msg;
            handleCloseActionsMenu();
            if (msg) handleReportClick(msg);
          }}>
          <ListItemIcon>
            <FlagIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {formatMessage({
              id: 'Report this message',
              defaultMessage: 'Report this message'
            })}
          </ListItemText>
        </MenuItem>
      </Menu>
      <StandardDialog
        open={isReportDialogOpen}
        onClose={handleCloseReportDialog}
        title={formatMessage({
          id: 'Report message',
          defaultMessage: 'Report message'
        })}
        actions={
          <>
            <Button onClick={handleCloseReportDialog} variant="outlined">
              {formatMessage({ id: 'Cancel', defaultMessage: 'Cancel' })}
            </Button>
            <Button
              onClick={handleConfirmReport}
              variant="contained"
              color="error">
              {formatMessage({
                id: 'Copy details & Report',
                defaultMessage: 'Copy details & Report'
              })}
            </Button>
          </>
        }>
        <Typography variant="body1">
          {formatMessage({
            id: 'Reporting a message opens the contact form to notify administrators. The message details (sender, content, and date) will be copied to your clipboard so you can paste them into the form.',
            defaultMessage:
              'Reporting a message opens the contact form to notify administrators. The message details (sender, content, and date) will be copied to your clipboard so you can paste them into the form.'
          })}
        </Typography>
      </StandardDialog>
    </DetailContainer>
  );
};

export default ConversationDetail;
