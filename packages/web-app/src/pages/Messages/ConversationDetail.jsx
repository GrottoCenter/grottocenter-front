import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntl, FormattedDate } from 'react-intl';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  List,
  TextField,
  IconButton,
  Tooltip,
  Button,
  useMediaQuery
} from '@mui/material';
import AppLink from '../../components/common/AppLink';
import SendIcon from '@mui/icons-material/Send';
import FlagIcon from '@mui/icons-material/Flag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/material/styles';

import { fetchConversationMessages } from '../../actions/Messaging/GetConversationMessages';
import { sendMessage } from '../../actions/Messaging/SendMessage';
import REDUCER_STATUS from '../../reducers/ReducerStatus';
import Alert from '../../components/common/Alert';
import StandardDialog from '../../components/common/StandardDialog';
import { useNotification } from '../../hooks';

const MESSAGES_PAGE_SIZE = 20;

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
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column-reverse' // Shows latest at the bottom
}));

// See StyledListItem in ./index.jsx: $-props must not reach the DOM.
const MessageBubble = styled(Paper, {
  shouldForwardProp: prop => !prop.startsWith('$')
})(({ theme, $isMine }) => ({
  padding: theme.spacing(0.5, 1),
  maxWidth: '75%',
  minWidth: 0,
  width: 'fit-content',
  alignSelf: $isMine ? 'flex-end' : 'flex-start',
  backgroundColor: $isMine
    ? theme.palette.primary.light
    : theme.palette.grey[200],
  color: $isMine
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  marginBottom: theme.spacing(0.5),
  borderRadius: 16,
  borderBottomRightRadius: $isMine ? 4 : 16,
  borderBottomLeftRadius: $isMine ? 16 : 4,
  wordBreak: 'break-word',
  overflowWrap: 'anywhere'
}));

const MessageDate = styled(Typography, {
  shouldForwardProp: prop => !prop.startsWith('$')
})(({ theme, $isMine }) => ({
  fontSize: '0.75rem',
  color: $isMine
    ? theme.palette.primary.contrastText
    : theme.palette.text.secondary,
  opacity: 0.7,
  marginTop: '4px',
  textAlign: 'right'
}));

const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  gap: theme.spacing(0.5),
  alignItems: 'flex-start',
  borderTop: `1px solid ${theme.palette.divider}`
}));

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
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  // Virtual keyboards have no usable Shift+Enter, so Enter must insert a line
  // break there and sending goes through the button only — as in every mobile
  // messaging app. Keyed on pointer type, not screen width: a narrow desktop
  // window still has a physical keyboard.
  const hasVirtualKeyboard = useMediaQuery('(pointer: coarse)');

  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedMessageToReport, setSelectedMessageToReport] = useState(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { onSuccess, onError } = useNotification();

  const {
    items: messages,
    totalCount,
    status,
    error
  } = useSelector(state => state.messaging.activeConversationMessages);

  const authState = useSelector(state => state.login);
  const myCaverId = authState?.authTokenDecoded?.id;

  const convIdNum = Number(conversationId);
  const activeConv = useSelector(state =>
    state.messaging.activeConversations.items.find(c => c.id === convIdNum)
  );
  const archivedConv = useSelector(state =>
    state.messaging.archivedConversations.items.find(c => c.id === convIdNum)
  );
  const currentConversation = activeConv || archivedConv;
  const fetchedPerson = useSelector(state => state.person.person);

  const otherParticipant =
    currentConversation?.otherParticipant ||
    messages.find(m => m.caverSender?.id !== myCaverId)?.caverSender ||
    (fetchedPerson && Number(fetchedPerson.id) !== Number(myCaverId)
      ? { id: fetchedPerson.id, nickname: fetchedPerson.nickname }
      : null);

  const titleText =
    otherParticipant?.nickname || formatMessage({ id: 'Conversation details' });

  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);
  const sentinelRef = useRef(null);
  const isFirstLoad = useRef(true);

  const hasMore = messages.length < totalCount;

  useEffect(() => {
    isFirstLoad.current = true;
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      dispatch(
        fetchConversationMessages(conversationId, {
          limit: MESSAGES_PAGE_SIZE,
          skip: 0
        })
      );
    }
  }, [dispatch, conversationId]);

  useEffect(() => {
    if (messages.length > 0 && isFirstLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isFirstLoad.current = false;
    }
  }, [messages]);

  const loadMore = useCallback(() => {
    if (status === REDUCER_STATUS.LOADING || !hasMore) return;
    dispatch(
      fetchConversationMessages(conversationId, {
        limit: MESSAGES_PAGE_SIZE,
        skip: messages.length
      })
    );
  }, [dispatch, conversationId, hasMore, messages.length, status]);

  useEffect(() => {
    if (!hasMore || status === REDUCER_STATUS.LOADING) return;

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
  }, [hasMore, status, loadMore]);

  if (!conversationId) {
    return (
      <BlankStateContainer>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {formatMessage({ id: 'Select a conversation to start messaging' })}
        </Typography>
      </BlankStateContainer>
    );
  }

  if (status === REDUCER_STATUS.LOADING && messages.length === 0) {
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

  if (status === REDUCER_STATUS.FAILED) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          title={
            error?.message ||
            formatMessage({ id: 'An error occurred while fetching messages.' })
          }
        />
      </Box>
    );
  }

  const handleSend = async () => {
    if (!replyText.trim() || replyText.length > 5000) return;
    setIsSending(true);
    try {
      await dispatch(sendMessage({ conversationId, body: replyText.trim() }));
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
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

  return (
    <DetailContainer>
      <Box
        sx={{
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center'
        }}>
        <IconButton
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            mr: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            p: '6px'
          }}
          onClick={() => navigate('/ui/messages')}>
          <ArrowBackIcon />
        </IconButton>
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            width: '1px',
            height: '24px',
            bgcolor: 'divider',
            mr: 1
          }}
        />
        <Typography variant="h6">
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
        {[...messages].reverse().map(msg => {
          const isMine = msg.caverSender?.id === myCaverId;
          return (
            <MessageBubble key={msg.id} elevation={1} $isMine={isMine}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 0.5
                }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.body}
                  </Typography>
                </Box>
                {!isMine && (
                  <Tooltip
                    title={formatMessage({
                      id: 'Report this message',
                      defaultMessage: 'Report this message'
                    })}>
                    <IconButton
                      size="small"
                      onClick={() => handleReportClick(msg)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' },
                        padding: 0.25,
                        mt: '4px',
                        ml: 0.5,
                        flexShrink: 0
                      }}>
                      <FlagIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <MessageDate $isMine={isMine}>
                <FormattedDate
                  value={msg.dateSent}
                  year="numeric"
                  month="short"
                  day="2-digit"
                  hour="2-digit"
                  minute="2-digit"
                  timeZone="UTC"
                  timeZoneName="short"
                />
              </MessageDate>
            </MessageBubble>
          );
        })}
        {hasMore && (
          <Box
            ref={sentinelRef}
            sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
            {status === REDUCER_STATUS.LOADING ? (
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
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
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
          helperText={
            // FormHelperText renders a <p>, which cannot contain a <div>.
            <Box
              component="span"
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                width: '100%',
                m: 0.25
              }}>
              <span
                style={{ color: replyText.length > 5000 ? 'red' : 'inherit' }}>
                {replyText.length > 5000
                  ? formatMessage({
                      id: 'Message exceeds 5000 characters limit.',
                      defaultMessage: 'Message exceeds 5000 characters limit.'
                    }) + ' '
                  : ''}
                {replyText.length} / 5000
              </span>
            </Box>
          }
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          // Pressing a button moves focus to it, which closes the virtual
          // keyboard. Suppressing the default keeps focus in the input.
          onMouseDown={e => e.preventDefault()}
          disabled={!replyText.trim() || replyText.length > 5000 || isSending}
          sx={{ mt: '4px' }}>
          {isSending ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </InputArea>
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
