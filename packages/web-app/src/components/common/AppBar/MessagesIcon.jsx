import { useIntl } from 'react-intl';
import { Badge, CircularProgress, IconButton } from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import { usePermissions, useUnreadMessageCount } from '../../../hooks';
import AppLink from '../AppLink';
import { APP_BAR_ICON_SIZE } from './constants';

const MessagesIcon = () => {
  const { formatMessage } = useIntl();
  const { isAuth } = usePermissions();
  const { data, isPending, isError, isSuccess } = useUnreadMessageCount({
    enabled: isAuth
  });

  if (!isAuth) return null;

  const nbMessages = (data?.active ?? 0) + (data?.archived ?? 0);
  let badgeContent;
  if (isPending) badgeContent = <CircularProgress size={10} />;
  else if (isError) badgeContent = '!';
  else if (isSuccess) badgeContent = nbMessages > 0 ? nbMessages : undefined;

  return (
    <IconButton
      aria-label={formatMessage({ id: 'My messages' })}
      component={AppLink}
      to="/ui/messages"
      color="inherit"
      size="large">
      <Badge
        overlap="rectangular"
        color={isError ? 'error' : 'secondary'}
        badgeContent={badgeContent}>
        <MailIcon sx={{ fontSize: APP_BAR_ICON_SIZE }} />
      </Badge>
    </IconButton>
  );
};

export default MessagesIcon;
