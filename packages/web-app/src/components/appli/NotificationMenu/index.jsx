import { useState, useCallback } from 'react';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Skeleton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import {
  useMenuNotifications,
  usePermissions,
  useReadAllNotifications,
  useReadNotification,
  useUnreadNotificationsCount
} from '../../../hooks';
import NotificationsIcon from './NotificationsIcon';
import NotificationsMenuItem from './NotificationMenuItem';

const NOTIFICATION_WIDTH = 320;
const NUMBER_OF_NOTIFICATIONS = 10;

const SeeAllMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 'bold',
  justifyContent: 'center',
  padding: theme.spacing(1)
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
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { isAuth } = usePermissions();
  const { data: menuData, isPending } = useMenuNotifications({
    size: NUMBER_OF_NOTIFICATIONS,
    enabled: isAuth
  });
  const notifications = menuData?.notifications;
  const displayedNotifications =
    notifications?.slice(0, NUMBER_OF_NOTIFICATIONS) ?? [];
  const { data: nbNotifications = 0 } = useUnreadNotificationsCount({
    enabled: isAuth
  });
  const readNotificationMutation = useReadNotification();
  const readAllMutation = useReadAllNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleOpen = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleNotificationClick = useCallback(
    notification => {
      if (!notification.dateReadAt) {
        readNotificationMutation.mutate(notification.id);
      }
      handleClose();
    },
    [readNotificationMutation, handleClose]
  );

  const handleSeeAllClick = useCallback(() => {
    handleClose();
    navigate('/ui/notifications');
  }, [handleClose, navigate]);

  const handleReadAll = useCallback(() => {
    readAllMutation.mutate();
  }, [readAllMutation]);

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
          list: {
            disablePadding: true,
            sx: { display: 'flex', flexDirection: 'column' }
          },
          paper: {
            sx: {
              mt: '4px',
              minWidth: NOTIFICATION_WIDTH,
              maxHeight: 'none',
              display: 'flex',
              flexDirection: 'column'
            }
          }
        }}>
        {/* Header */}
        <Box
          sx={{
            px: 1,
            py: 1,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            borderBottom: 1,
            borderColor: 'divider'
          }}>
          <Typography variant="body2" color="text.primary">
            {formatMessage({ id: 'Notifications' })}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {nbNotifications > 0 && (
              <Chip label={nbNotifications} color="secondary" size="small" />
            )}
            <Tooltip
              title={formatMessage({
                id: nbNotifications
                  ? 'Mark all as read'
                  : 'No unread notifications'
              })}>
              <span>
                <IconButton
                  color="secondary"
                  size="small"
                  disabled={!nbNotifications}
                  onClick={handleReadAll}>
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Scrollable notifications list */}
        <Box sx={{ overflowY: 'auto', maxHeight: 400 }}>
          {isPending &&
            !notifications &&
            createSkeletons(Math.min(nbNotifications, 100) || 3)}
          {displayedNotifications.map((notification, idx) => (
            <NotificationsMenuItem
              key={notification.id}
              notification={notification}
              onClick={handleNotificationClick}
              divider={idx < displayedNotifications.length - 1}
            />
          ))}

          {/* Empty state */}
          {notifications && notifications.length === 0 && (
            <Box
              sx={{
                px: 1,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
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
        <SeeAllMenuItem
          onClick={handleSeeAllClick}
          sx={{ borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
          {formatMessage({ id: 'See all notifications' })}
        </SeeAllMenuItem>
      </Menu>
    </>
  );
};

NotificationMenu.propTypes = {};

export default NotificationMenu;
