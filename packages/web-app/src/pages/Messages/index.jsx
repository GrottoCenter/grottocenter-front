import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl, FormattedDate } from 'react-intl';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Pagination,
  CircularProgress,
  Button,
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { styled } from '@mui/material/styles';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import AuthChecker from '../../components/appli/AuthChecker';
import StatusMessage from '../../components/common/StatusMessage';
import REDUCER_STATUS from '../../reducers/ReducerStatus';
import { fetchConversations } from '../../actions/Messaging/GetConversations';
import { archiveConversation } from '../../actions/Messaging/ArchiveConversation';
import { unarchiveConversation } from '../../actions/Messaging/UnarchiveConversation';
import ConversationDetail from './ConversationDetail';
import ComposeDialog from './ComposeDialog';

const PAGE_SIZE = 20;

const StyledListItem = styled(ListItem)(({ theme, $isUnread }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  ...( $isUnread && {
    '& .MuiListItemText-primary': {
      fontWeight: 'bold',
    }
  })
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  color: theme.palette.text.secondary
}));

const MessagesPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { conversationId } = useParams();
  const [tabValue, setTabValue] = useState(0); // 0 = Active, 1 = Archived
  const [page, setPage] = useState(1);
  const [isComposeOpen, setComposeOpen] = useState(false);

  const composeTo = searchParams.get('composeTo');

  useEffect(() => {
    if (composeTo) {
      setComposeOpen(true);
    }
  }, [composeTo]);

  const handleCloseCompose = () => {
    setComposeOpen(false);
    if (composeTo) {
      setSearchParams({});
    }
  };

  const isArchived = tabValue === 1;
  const listKey = isArchived ? 'archivedConversations' : 'activeConversations';

  const { items: conversations, totalCount, status, error } = useSelector(
    state => state.messaging[listKey]
  );

  useEffect(() => {
    dispatch(fetchConversations({ limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }, isArchived));
  }, [dispatch, page, isArchived]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1); // Reset to page 1 on tab switch
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const renderContent = () => {
    if (status === REDUCER_STATUS.LOADING && conversations.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (status === REDUCER_STATUS.FAILED) {
      return (
        <StatusMessage
          type="error"
          message={error?.message || formatMessage({ id: 'An error occurred while fetching conversations.' })}
        />
      );
    }

    if (conversations.length === 0) {
      return (
        <EmptyStateContainer>
          <Typography variant="body1">
            {formatMessage({ id: 'No conversations found.' })}
          </Typography>
        </EmptyStateContainer>
      );
    }

    // Unread conversations at the top, then sorted by most recent
    const sortedConversations = [...conversations].sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      const dateA = a.lastMessage ? new Date(a.lastMessage.dateSent) : new Date(a.dateInscription);
      const dateB = b.lastMessage ? new Date(b.lastMessage.dateSent) : new Date(b.dateInscription);
      return dateB - dateA;
    });

    return (
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {sortedConversations.map(conv => {
          const isUnread = conv.unreadCount > 0;
          return (
            <StyledListItem
              key={conv.id}
              $isUnread={isUnread}
              divider
              onClick={() => navigate(`/ui/messages/${conv.id}`)}
              secondaryAction={
                <Tooltip title={formatMessage({ id: isArchived ? 'Unarchive' : 'Archive' })}>
                  <IconButton
                    edge="end"
                    aria-label={isArchived ? "unarchive" : "archive"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isArchived) {
                        dispatch(unarchiveConversation(conv.id));
                        if (conversationId === String(conv.id)) {
                          navigate('/ui/messages');
                        }
                      } else {
                        dispatch(archiveConversation(conv.id));
                        if (conversationId === String(conv.id)) {
                          navigate('/ui/messages');
                        }
                      }
                    }}
                  >
                    {isArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
                  </IconButton>
                </Tooltip>
              }>
              <ListItemAvatar>
                <Badge
                  color="secondary"
                  badgeContent={conv.unreadCount}
                  invisible={!isUnread}>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={conv.otherParticipant?.nickname || formatMessage({ id: 'Unknown' })}
                secondary={
                  conv.lastMessage && (
                    <FormattedDate
                      value={conv.lastMessage.dateSent}
                      year="numeric"
                      month="long"
                      day="2-digit"
                      hour="2-digit"
                      minute="2-digit"
                    />
                  )
                }
              />
            </StyledListItem>
          );
        })}
      </List>
    );
  };

  return (
    <Layout
      title={formatMessage({ id: 'My messages' })}
      content={
        <AuthChecker
          componentToDisplay={
            <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', width: '100%', mt: -2 }}>
              
              {/* Left Pane: Conversation List */}
              <Box sx={{ 
                width: { xs: '100%', md: '350px' }, 
                flexShrink: 0,
                borderRight: 1, 
                borderColor: 'divider', 
                display: 'flex', 
                flexDirection: 'column',
                bgcolor: 'background.paper'
              }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" component="h1">
                    {formatMessage({ id: 'My messages' })}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setComposeOpen(true);
                    }}>
                    {formatMessage({ id: 'New Message' })}
                  </Button>
                </Box>

                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="fullWidth"
                  sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label={formatMessage({ id: 'Active' })} />
                  <Tab label={formatMessage({ id: 'Archived' })} />
                </Tabs>
                
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                  {renderContent()}
                  
                  {totalCount > PAGE_SIZE && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <Pagination
                        count={Math.ceil(totalCount / PAGE_SIZE)}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Right Pane: Conversation Details */}
              <Box sx={{ 
                flexGrow: 1, 
                display: { xs: 'none', md: 'block' },
                height: '100%',
                bgcolor: 'background.default'
              }}>
                <ConversationDetail />
              </Box>

              <ComposeDialog
                open={isComposeOpen}
                onClose={handleCloseCompose}
                prefilledRecipientId={composeTo || undefined}
              />
            </Box>
          }
        />
      }
    />
  );
};

export default MessagesPage;
