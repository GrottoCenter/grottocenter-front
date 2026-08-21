import { useIntl } from 'react-intl';
import { Badge, CircularProgress, IconButton } from '@mui/material';
import MuiNotificationsIcon from '@mui/icons-material/Notifications';
import PropTypes from 'prop-types';
import { APP_BAR_ICON_SIZE } from '@/components/common/AppBar/constants';
import { usePermissions, useUnreadNotificationsCount } from '../../../hooks';

const NotificationsIcon = ({ onClick }) => {
  const { formatMessage } = useIntl();
  const { isAuth } = usePermissions();
  const {
    data: nbNotifications,
    isPending,
    isError,
    isSuccess
  } = useUnreadNotificationsCount({ enabled: isAuth });

  if (!isAuth) return '';

  let badgeContent;
  if (isPending) badgeContent = <CircularProgress size={10} />;
  else if (isError) badgeContent = '!';
  else if (isSuccess) badgeContent = nbNotifications;

  return (
    <IconButton
      aria-label={formatMessage({ id: 'notifications of current user' })}
      onClick={onClick}
      color="inherit"
      size="large">
      <Badge
        overlap="rectangular"
        color={isError ? 'error' : 'secondary'}
        badgeContent={badgeContent}>
        <MuiNotificationsIcon sx={{ fontSize: APP_BAR_ICON_SIZE }} />
      </Badge>
    </IconButton>
  );
};

NotificationsIcon.propTypes = {
  onClick: PropTypes.func.isRequired
};

export default NotificationsIcon;
