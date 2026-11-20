import { CircularProgress } from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useIntl } from 'react-intl';

export const useSubscriptionAction = ({
  isSubscribed,
  isLoading,
  canSubscribe,
  onClick
}) => {
  const { formatMessage } = useIntl();
  let icon = <CircularProgress size={20} />;
  if (!isLoading) {
    icon = isSubscribed ? (
      <NotificationsActiveIcon />
    ) : (
      <NotificationsNoneIcon />
    );
  }

  return {
    key: 'subscribe',
    icon,
    label: formatMessage({ id: isSubscribed ? 'Unsubscribe' : 'Subscribe' }),
    onClick,
    color: isSubscribed ? 'secondary' : 'primary',
    hidden: !canSubscribe
  };
};
