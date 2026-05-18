import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useIntl, FormattedDate } from 'react-intl';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  List,
  TextField,
  IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles';

import { fetchConversationMessages } from '../../actions/Messaging/GetConversationMessages';
import { sendMessage } from '../../actions/Messaging/SendMessage';
import REDUCER_STATUS from '../../reducers/ReducerStatus';
import StatusMessage from '../../components/common/StatusMessage';

const DetailContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  bgcolor: theme.palette.background.default
}));

const MessagesList = styled(List)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column-reverse' // Shows latest at the bottom
}));

const MessageBubble = styled(Paper)(({ theme, $isMine }) => ({
  padding: theme.spacing(1, 2),
  maxWidth: '75%',
  width: 'fit-content',
  alignSelf: $isMine ? 'flex-end' : 'flex-start',
  backgroundColor: $isMine ? theme.palette.primary.light : theme.palette.grey[200],
  color: $isMine ? theme.palette.primary.contrastText : theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  borderRadius: 16,
  borderBottomRightRadius: $isMine ? 4 : 16,
  borderBottomLeftRadius: $isMine ? 16 : 4
}));

const MessageDate = styled(Typography)(({ theme, $isMine }) => ({
  fontSize: '0.75rem',
  color: $isMine ? theme.palette.primary.contrastText : theme.palette.text.secondary,
  opacity: 0.8,
  marginTop: theme.spacing(0.5),
  textAlign: 'right'
}));

const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'flex-start',
  borderTop: `1px solid ${theme.palette.divider}`
}));

const BlankStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  backgroundColor: theme.palette.action.hover,
  color: theme.palette.text.secondary
}));

const ConversationDetail = () => {
  const { conversationId } = useParams();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  
  const [replyText, setReplyText] = useState('');
  
  const { items: messages, status, error } = useSelector(
    state => state.messaging.activeConversationMessages
  );
  
  const authState = useSelector(state => state.login);
  const myCaverId = authState?.authTokenDecoded?.id;

  const convIdNum = Number(conversationId);
  const activeConv = useSelector(state => state.messaging.activeConversations.items.find(c => c.id === convIdNum));
  const archivedConv = useSelector(state => state.messaging.archivedConversations.items.find(c => c.id === convIdNum));
  const currentConversation = activeConv || archivedConv;
  
  const titleText = currentConversation?.otherParticipant?.nickname || formatMessage({ id: 'Conversation details' });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchConversationMessages(conversationId, { limit: 50, skip: 0 }));
    }
  }, [dispatch, conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!conversationId) {
    return (
      <BlankStateContainer>
        <Typography variant="h6">
          {formatMessage({ id: 'Select a conversation to start messaging' })}
        </Typography>
      </BlankStateContainer>
    );
  }

  if (status === REDUCER_STATUS.LOADING && messages.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === REDUCER_STATUS.FAILED) {
    return (
      <Box sx={{ p: 3 }}>
        <StatusMessage
          type="error"
          message={error?.message || formatMessage({ id: 'An error occurred while fetching messages.' })}
        />
      </Box>
    );
  }

  const handleSend = () => {
    if (!replyText.trim()) return;
    dispatch(sendMessage({ conversationId, body: replyText.trim() }));
    setReplyText('');
  };

  return (
    <DetailContainer>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h6">
          {titleText}
        </Typography>
      </Box>
      
      <MessagesList>
        <div ref={messagesEndRef} />
        {[...messages].reverse().map(msg => {
          const isMine = msg.caverSender?.id === myCaverId;
          return (
            <MessageBubble key={msg.id} elevation={1} $isMine={isMine}>
              {!isMine && msg.caverSender && (
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                  <a
                    href={`/ui/persons/${msg.caverSender.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    {msg.caverSender.nickname}
                  </a>
                </Typography>
              )}
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.body}</Typography>
              <MessageDate $isMine={isMine}>
                <FormattedDate
                  value={msg.dateSent}
                  year="numeric"
                  month="short"
                  day="2-digit"
                  hour="2-digit"
                  minute="2-digit"
                />
              </MessageDate>
            </MessageBubble>
          );
        })}
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
          onKeyPress={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          size="small"
        />
        <IconButton 
          color="primary" 
          onClick={handleSend}
          disabled={!replyText.trim()}
          sx={{ mt: 0.5 }}>
          <SendIcon />
        </IconButton>
      </InputArea>
    </DetailContainer>
  );
};

export default ConversationDetail;
