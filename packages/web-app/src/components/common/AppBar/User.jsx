import {
  Badge,
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
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import BuildIcon from '@mui/icons-material/Build';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { pathOr } from 'ramda';

import { fetchDuplicatesCount } from '../../../actions/DuplicatesCount';
import { fetchPendingDocumentsCount } from '../../../actions/PendingDocumentsCount';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import UserAvatar from '@/components/common/UserAvatar';
import Translate from '../Translate';
import { usePermissions, useUserProperties } from '../../../hooks';

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
  const dispatch = useDispatch();
  const userProperties = useUserProperties();
  const permissions = usePermissions();
  const pendingDocumentsCount = useSelector(
    state => state.pendingDocumentsCount
  );
  const duplicatesCount = useSelector(state => state.duplicatesCount);

  const userId = pathOr(null, ['id'], userProperties);
  const open = Boolean(anchorEl);
  const hasDashboardAccess =
    permissions.isAdmin || permissions.isModerator || permissions.isLeader;

  const bothCountsSucceeded =
    pendingDocumentsCount.status === REDUCER_STATUS.SUCCEEDED &&
    duplicatesCount.status === REDUCER_STATUS.SUCCEEDED;
  const hasPendingTasks =
    pendingDocumentsCount.value + duplicatesCount.value > 0;
  const showPendingDot =
    permissions.isModerator && bothCountsSucceeded && hasPendingTasks;

  useEffect(() => {
    if (permissions.isModerator) {
      dispatch(fetchPendingDocumentsCount());
      dispatch(fetchDuplicatesCount());
    }
  }, [dispatch, permissions.isModerator]);

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

  const handleMyContributionsClick = useCallback(() => {
    handleClose();
    navigate('/ui/contributions');
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
        <Badge
          overlap="circular"
          variant="dot"
          color="secondary"
          invisible={!showPendingDot}
          sx={{
            '& .MuiBadge-dot': {
              minWidth: 10,
              height: 10,
              borderRadius: '50%',
              border: '1px solid #fff',
              boxSizing: 'content-box'
            }
          }}>
          <UserAvatar username={userNickname} />
        </Badge>
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
            px: 1,
            py: 1,
            bgcolor: 'action.hover',
            display: 'flex',
            flexDirection: 'column'
          }}>
          <Typography variant="body2" color="text.primary">
            <Translate
              id="Logged as {userNickname}"
              values={{
                userNickname: <strong key="userNickname">{userNickname}</strong>
              }}
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
            <AccountBoxIcon />
          </ListItemIcon>
          <Translate>My Account</Translate>
        </MenuItem>
        <MenuItem onClick={handleMyContributionsClick}>
          <ListItemIcon>
            <ListAltIcon />
          </ListItemIcon>
          <Translate>My contributions</Translate>
        </MenuItem>
        {hasDashboardAccess && [
          <Divider key="management-tools-divider" />,
          <MenuItem key="management-tools" onClick={handleDashboardClick}>
            <ListItemIcon>
              <BuildIcon />
            </ListItemIcon>
            <Translate>Management tools</Translate>
            {showPendingDot && (
              <Box
                sx={{
                  ml: 'auto',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'secondary.main'
                }}
              />
            )}
          </MenuItem>
        ]}

        {/* Session expired warning */}
        {isSessionExpired && (
          <Box sx={{ px: 1, py: '12px' }}>
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
