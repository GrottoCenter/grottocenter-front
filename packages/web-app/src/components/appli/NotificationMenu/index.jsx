import React, { useState, useCallback } from 'react';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import {
  Box,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Typography,
  Skeleton
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { usePermissions } from '../../../hooks';
import NotificationsIcon from './NotificationsIcon';
import { fetchMenuNotifications } from '../../../actions/Notifications/GetMenuNotifications';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import NotificationsMenuItem from './NotificationMenuItem';
import { readNotification } from '../../../actions/Notifications/ReadNotification';
import { countUnreadNotifications } from '../../../actions/Notifications/CountUnreadNotifications';

const NOTIFICATION_WIDTH = 320;
const NUMBER_OF_NOTIFICATIONS = 10;

const SeeAllMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 'bold',
  justifyContent: 'center',
  padding: theme.spacing(2)
}));

const createSkeletons = n =>
  [...Array(n)].map((e, i) => (
    // Dummy skeletons which will disappear: we can ignore the eslint rule
    // eslint-disable-next-line react/no-array-index-key
    <MenuItem key={i} style={{ width: NOTIFICATION_WIDTH }}>
      <Skeleton width={NOTIFICATION_WIDTH} />
    </MenuItem>
  ));

const NotificationMenu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { isAuth } = usePermissions();
  const { notifications, status } = useSelector(
    state => state.menuNotifications
  );
  const { count: nbNotifications } = useSelector(
    state => state.countUnreadNotifications
  );

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleOpen = useCallback(
    event => {
      dispatch(fetchMenuNotifications({ size: NUMBER_OF_NOTIFICATIONS }));
      dispatch(countUnreadNotifications());
      setAnchorEl(event.currentTarget);
    },
    [dispatch]
  );

  const handleNotificationClick = useCallback(
    notification => {
      if (!notification.dateReadAt) {
        dispatch(readNotification(notification.id));
      }
      handleClose();
    },
    [dispatch, handleClose]
  );

  const handleSeeAllClick = useCallback(() => {
    handleClose();
    navigate('/ui/notifications');
  }, [handleClose, navigate]);

  if (!isAuth) return '';
  return (
    <>
      <NotificationsIcon onClick={handleOpen} />
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: { disablePadding: true, sx: { display: 'flex', flexDirection: 'column' } },
          paper: { sx: { mt: '4px', minWidth: NOTIFICATION_WIDTH, maxHeight: 'none', display: 'flex', flexDirection: 'column' } }
        }}>
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 2,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
          <Typography variant="body2" color="text.primary">
            {formatMessage({ id: 'Notifications' })}
          </Typography>
          {nbNotifications > 0 && (
            <Chip label={nbNotifications} color="secondary" size="small" />
          )}
        </Box>

        <Divider sx={{ flexShrink: 0 }} />

        {/* Scrollable notifications list */}
        <Box sx={{ overflowY: 'auto', maxHeight: 400 }}>
          {status === REDUCER_STATUS.LOADING &&
            !notifications &&
            createSkeletons(Math.min(nbNotifications, 100) || 3)}
          {notifications &&
            notifications.length > 0 &&
            notifications
              .slice(0, NUMBER_OF_NOTIFICATIONS)
              .map((notification, idx) => (
                <div key={notification.id}>
                  <NotificationsMenuItem
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                  {idx !== notifications.length - 1 && <Divider />}
                </div>
              ))}

          {/* Empty state */}
          {notifications && notifications.length === 0 && (
            <Box
              sx={{
                px: 2,
                py: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                color: 'action.active'
              }}>
              <NotificationsOffIcon />
              <Typography variant="body2">
                {formatMessage({ id: 'You have no notifications.' })}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Sticky footer */}
        <Divider sx={{ flexShrink: 0 }} />
        <SeeAllMenuItem onClick={handleSeeAllClick}>
          {formatMessage({ id: 'See all notifications' })}
        </SeeAllMenuItem>
      </Menu>
    </>
  );
};

NotificationMenu.propTypes = {};

export default NotificationMenu;
