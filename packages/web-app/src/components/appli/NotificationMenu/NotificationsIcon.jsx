import React, { useEffect } from 'react';
import { Badge, CircularProgress, IconButton } from '@mui/material';
import MuiNotificationsIcon from '@mui/icons-material/Notifications';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { usePermissions } from '../../../hooks';
import { countUnreadNotifications } from '../../../actions/Notifications/CountUnreadNotifications';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';

const getBadgeContent = (nbNotifications, status) => {
  switch (status) {
    case REDUCER_STATUS.LOADING:
      return <CircularProgress size={10} />;
    case REDUCER_STATUS.FAILED:
      return '!';
    case REDUCER_STATUS.SUCCEEDED:
      return nbNotifications;
    default:
      return undefined;
  }
};

const NotificationsIcon = ({ onClick }) => {
  const dispatch = useDispatch();
  const { isAuth } = usePermissions();
  const { count: nbNotifications, status } = useSelector(
    state => state.countUnreadNotifications
  );

  useEffect(() => {
    dispatch(countUnreadNotifications());
  }, [dispatch]);

  if (!isAuth) return '';
  return (
    <IconButton
      aria-label="notifications of current user"
      onClick={onClick}
      color="inherit"
      size="large">
      <Badge
        color={status === REDUCER_STATUS.FAILED ? 'error' : 'secondary'}
        badgeContent={getBadgeContent(nbNotifications, status)}>
        <MuiNotificationsIcon />
      </Badge>
    </IconButton>
  );
};

NotificationsIcon.propTypes = {
  onClick: PropTypes.func.isRequired
};

export default NotificationsIcon;
