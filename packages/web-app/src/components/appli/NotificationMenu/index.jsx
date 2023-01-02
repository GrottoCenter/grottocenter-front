import React from 'react';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import {
  Box,
  Divider,
  Menu,
  MenuItem,
  Typography,
  Skeleton
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { usePermissions } from '../../../hooks';
import NotificationsIcon from './NotificationsIcon';
import { fetchMenuNotifications } from '../../../actions/Notifications/GetMenuNotifications';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import NotificationsMenuItem from './NotificationMenuItem';
import { readNotification } from '../../../actions/Notifications/ReadNotification';
import { countUnreadNotifications } from '../../../actions/Notifications/CountUnreadNotifications';

const NOTIFICATION_WIDTH = 320;
const NUMBER_OF_NOTIFICATIONS = 10;

const SeeAllMenuItem = styled(MenuItem)`
  ${({ theme }) => `
    color: ${theme.palette.primary.main};
    font-weight: bold;
    justify-content: center;
    padding: ${theme.spacing(3)};
  `}
`;

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
  const history = useHistory();
  const { formatMessage } = useIntl();
  const { isAuth } = usePermissions();
  const { notifications, status } = useSelector(
    state => state.menuNotifications
  );
  const { count: nbNotifications } = useSelector(
    state => state.countUnreadNotifications
  );

  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOnMenuClick = event => {
    dispatch(fetchMenuNotifications({ size: NUMBER_OF_NOTIFICATIONS }));
    dispatch(countUnreadNotifications());
    setAnchorEl(event.currentTarget);
  };

  const handleOnNotificationClick = notification => {
    if (!notification.dateReadAt) {
      dispatch(readNotification(notification.id));
    }
    handleCloseMenu();
  };

  const handleOnSeeAllLinkClick = () => {
    handleCloseMenu();
    history.push('/ui/notifications');
  };

  if (!isAuth) return '';
  return (
    <>
      <NotificationsIcon onClick={handleOnMenuClick} />
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        MenuListProps={{
          style: { padding: 0 }
        }}>
        {status === REDUCER_STATUS.LOADING &&
          !notifications &&
          // Arbitrary number (3) of notifications if real number is not available
          createSkeletons(nbNotifications || 3)}
        {notifications &&
          notifications.length > 0 &&
          notifications
            .slice(0, NUMBER_OF_NOTIFICATIONS)
            .map((notification, idx) => (
              <div key={notification.id}>
                <NotificationsMenuItem
                  notification={notification}
                  onClick={handleOnNotificationClick}
                  width={NOTIFICATION_WIDTH}
                />
                {idx !== notifications.length - 1 && <Divider />}
              </div>
            ))}
        {notifications && notifications.length === 0 && (
          <MenuItem disabled>
            <Box flexDirection="row" display="flex">
              <NotificationsOffIcon />
              <Typography>
                {formatMessage({ id: 'You have no notifications.' })}
              </Typography>
            </Box>
          </MenuItem>
        )}
        <SeeAllMenuItem onClick={handleOnSeeAllLinkClick}>
          {formatMessage({ id: 'See all notifications' }).toUpperCase()}
        </SeeAllMenuItem>
      </Menu>
    </>
  );
};

NotificationMenu.propTypes = {};

export default NotificationMenu;
