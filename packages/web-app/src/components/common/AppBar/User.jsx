import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  Alert,
  ListItemIcon
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { pathOr } from 'ramda';

import Translate from '../Translate';
import { useUserProperties } from '../../../hooks';
import UserAvatar from './UserAvatar';

// Constants
const MENU_MIN_WIDTH = 250;

const UserMenu = ({
  authTokenExpirationDate,
  isAuth,
  userNickname,
  onLoginClick,
  onLogoutClick
}) => {
  const { formatDate, formatMessage, formatTime } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const userProperties = useUserProperties();

  const userId = pathOr(null, ['id'], userProperties);
  const open = Boolean(anchorEl);

  const isSessionExpired = authTokenExpirationDate < Date.now();

  const handleMenu = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Before using onLogoutClick(), we need to handle the menu closing
  // to detach the popover menu before the account icon/button changes.
  const handleLogoutClick = useCallback(() => {
    handleClose();
    onLogoutClick();
  }, [handleClose, onLogoutClick]);

  const handleMyAccountClick = useCallback(() => {
    handleClose();
    navigate('/ui/account');
  }, [handleClose, navigate]);

  const handleDashboardClick = useCallback(() => {
    handleClose();
    navigate('/ui/dashboard');
  }, [handleClose, navigate]);

  return !isAuth ? (
    <Button color="inherit" onClick={onLoginClick} variant="outlined">
      <Translate>Log in</Translate>
    </Button>
  ) : (
    <>
      <IconButton
        aria-label={formatMessage({ id: 'account of current user' })}
        aria-controls="menu-appbar"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleMenu}
        color="inherit"
        size="large">
        <UserAvatar username={userNickname} />
      </IconButton>
      <Menu
        id="menu-appbar"
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
          list: { disablePadding: true },
          paper: {
            sx: {
              minWidth: MENU_MIN_WIDTH,
              maxWidth: '90vw',
              mt: '4px'
            }
          }
        }}>
        {/* Primary content: User info */}
        <Box
          sx={{
            px: 2,
            py: 2,
            bgcolor: 'action.hover',
            display: 'flex',
            flexDirection: 'column'
          }}>
          <Typography variant="body2" color="text.primary">
            <Translate
              id="Logged as {userNickname}"
              values={{ userNickname: <strong key="userNickname">{userNickname}</strong> }}
            />
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatMessage(
              {
                id: 'Expiration Date: {expirationDate} at {expirationHourAndMinutes}',
                defaultMessage:
                  'Expiration Date: {expirationDate} at {expirationHourAndMinutes}'
              },
              {
                expirationDate: formatDate(authTokenExpirationDate),
                expirationHourAndMinutes: formatTime(authTokenExpirationDate)
              }
            )}
          </Typography>
        </Box>

        <Divider />

        {/* Primary actions */}
        <MenuItem disabled={!userId} onClick={handleMyAccountClick}>
          <ListItemIcon>
            <AccountCircleIcon />
          </ListItemIcon>
          <Translate>My Account</Translate>
        </MenuItem>
        <MenuItem onClick={handleDashboardClick}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <Translate>Dashboard</Translate>
        </MenuItem>

        {/* Session expired warning */}
        {isSessionExpired && (
          <Box sx={{ px: 2, py: '12px' }}>
            <Alert severity="error">
              {formatMessage({
                id: 'Your session has expired: please log in again.'
              })}
            </Alert>
          </Box>
        )}

        <Divider />

        {/* Secondary actions */}
        <MenuItem onClick={handleLogoutClick}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <Translate>Log out</Translate>
        </MenuItem>
      </Menu>
    </>
  );
};

UserMenu.propTypes = {
  authTokenExpirationDate: PropTypes.instanceOf(Date),
  userNickname: PropTypes.string,
  isAuth: PropTypes.bool.isRequired,
  onLoginClick: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired
};

export default UserMenu;
