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
  Typography,
  Pagination,
  CircularProgress,
  Button,
  Badge,
  IconButton,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { styled } from '@mui/material/styles';

import PageContainer from '@/components/common/Layouts/PageContainer';
import UserAvatar from '@/components/common/UserAvatar';
import AuthChecker from '../../components/appli/AuthChecker';
import Alert from '../../components/common/Alert';
import REDUCER_STATUS from '../../reducers/ReducerStatus';
import { fetchConversations } from '../../actions/Messaging/GetConversations';
import { archiveConversation } from '../../actions/Messaging/ArchiveConversation';
import { unarchiveConversation } from '../../actions/Messaging/UnarchiveConversation';
import ConversationDetail from './ConversationDetail';
import ComposeDialog from './ComposeDialog';

const PAGE_SIZE = 20;

// $-prefixed props are an emotion convention, not a MUI one: styled() forwards
// every prop to ListItem, which spreads it onto the DOM. Filter them out.
const StyledListItem = styled(ListItem, {
  shouldForwardProp: prop => !prop.startsWith('$')
})(({ theme, $isUnread }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  ...($isUnread && {
    '& .MuiListItemText-primary': {
      fontWeight: 'bold',
    }
  })
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  color: theme.palette.text.secondary
}));

// Master-detail inbox: no card chrome and full-screen on mobile (like any mail
// client), standard page card on desktop.
//
// The height fills the viewport minus everything around the card. Each term is
// derived from the theme rather than hardcoded. `containerPb` must stay in sync
// with PageContainer's own `pb: 1`.
const StyledCard = styled(Card)(({ theme }) => {
  const containerPb = theme.spacing(0.5);
  const chromeXs = containerPb;
  const chromeMd = `${theme.spacing(1)} * 2 + ${containerPb}`; // margins + pb
  return `
  display: flex;
  flex-direction: column;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
  height: calc(100vh - ${theme.appBarHeight}px - (${chromeXs})); /* fallback */
  height: calc(100dvh - ${theme.appBarHeight}px - (${chromeXs}));

  ${theme.breakpoints.up('md')} {
    margin: ${theme.spacing(1)};
    border-radius: ${theme.shape.borderRadius};
    box-shadow: ${theme.shadows[1]};
    height: calc(100vh - ${theme.appBarHeight}px - (${chromeMd}));
    height: calc(100dvh - ${theme.appBarHeight}px - (${chromeMd}));
  }
`;
});

const StyledCardContent = styled(CardContent)({
  flexGrow: 1,
  minHeight: 0,
  overflowY: 'auto',
  scrollBehavior: 'smooth',
  padding: 0,
  '&:last-child': {
    paddingBottom: 0
  }
});

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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (status === REDUCER_STATUS.FAILED) {
      return (
        <Alert
          severity="error"
          title={error?.message || formatMessage({ id: 'An error occurred while fetching conversations.' })}
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
                  <UserAvatar
                    username={conv.otherParticipant?.nickname}
                    color="primary"
                    sx={{ width: 40, height: 40 }}
                  />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={conv.otherParticipant?.nickname || formatMessage({ id: 'Unknown' })}
                secondary={
                  conv.lastMessage && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      <FormattedDate
                        value={conv.lastMessage.dateSent}
                        year="numeric"
                        month="long"
                        day="2-digit"
                        hour="2-digit"
                        minute="2-digit"
                        timeZone="UTC"
                        timeZoneName="short"
                      />
                    </Typography>
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
    <PageContainer>
      <StyledCard>
        <StyledCardContent>
          <AuthChecker
            componentToDisplay={
              <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
                {/* Left Pane: Conversation List */}
                <Box sx={{
                  width: { xs: '100%', md: '350px' },
                  flexShrink: 0,
                  borderRight: 1,
                  borderColor: 'divider',
                  display: { xs: conversationId ? 'none' : 'flex', md: 'flex' },
                  flexDirection: 'column',
                  bgcolor: 'background.paper'
                }}>
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" component="h1">
                      {formatMessage({ id: 'Conversations', defaultMessage: 'Conversations' })}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<EditIcon />}
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
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
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
                  display: { xs: conversationId ? 'block' : 'none', md: 'block' },
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
        </StyledCardContent>
      </StyledCard>
    </PageContainer>
  );
};

export default MessagesPage;
