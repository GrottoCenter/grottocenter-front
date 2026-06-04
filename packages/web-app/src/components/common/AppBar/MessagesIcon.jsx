import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Badge, CircularProgress, IconButton } from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { usePermissions } from '../../../hooks';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import { fetchUnreadMessageCount } from '../../../actions/Messaging/CountUnreadMessages';

const getBadgeContent = (nbMessages, status) => {
  switch (status) {
    case REDUCER_STATUS.LOADING:
      return <CircularProgress size={10} />;
    case REDUCER_STATUS.FAILED:
      return '!';
    case REDUCER_STATUS.SUCCEEDED:
      return nbMessages > 0 ? nbMessages : undefined;
    default:
      return undefined;
  }
};

const MessagesIcon = () => {
  const { formatMessage } = useIntl();
  const { isAuth } = usePermissions();
  const dispatch = useDispatch();
  
  const { active, archived, status } = useSelector(
    state => state.messaging.unreadCounts
  );

  useEffect(() => {
    if (isAuth) {
      dispatch(fetchUnreadMessageCount());
    }
  }, [dispatch, isAuth]);

  if (!isAuth) return null;

  // The badge displays the sum of active and archived unread counts
  const nbMessages = active + archived;

  return (
    <IconButton
      aria-label={formatMessage({ id: 'My messages' })}
      component={Link}
      to="/ui/messages"
      color="inherit"
      size="large">
      <Badge
        overlap="rectangular"
        color={status === REDUCER_STATUS.FAILED ? 'error' : 'secondary'}
        badgeContent={getBadgeContent(nbMessages, status)}>
        <MailIcon sx={{ fontSize: 28 }} />
      </Badge>
    </IconButton>
  );
};

export default MessagesIcon;
