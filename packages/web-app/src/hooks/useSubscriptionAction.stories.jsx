import PropTypes from 'prop-types';
import ShareIcon from '@mui/icons-material/Share';
import { useIntl } from 'react-intl';
import { action } from 'storybook/actions';
import ResponsiveActions from '@/components/common/Layouts/ResponsiveActions';
import { useSubscriptionAction } from './useSubscriptionAction';

const SubscriptionActionPreview = ({
  isSubscribed,
  isLoading,
  canSubscribe
}) => {
  const { formatMessage } = useIntl();
  const subscriptionAction = useSubscriptionAction({
    isSubscribed,
    isLoading,
    canSubscribe,
    onClick: action('subscription-change')
  });
  return (
    <ResponsiveActions
      items={[
        subscriptionAction,
        {
          key: 'share',
          icon: <ShareIcon />,
          label: formatMessage({ id: 'Copy link' }),
          onClick: action('share')
        }
      ]}
    />
  );
};

SubscriptionActionPreview.propTypes = {
  isSubscribed: PropTypes.bool,
  isLoading: PropTypes.bool,
  canSubscribe: PropTypes.bool
};

const meta = {
  title: 'Hooks/SubscriptionAction',
  component: SubscriptionActionPreview,
  args: { isSubscribed: false, isLoading: false, canSubscribe: true }
};
export default meta;

export const Subscribe = {};
export const Unsubscribe = { args: { isSubscribed: true } };
export const Pending = { args: { isLoading: true } };
export const PendingUnsubscribe = {
  args: { isSubscribed: true, isLoading: true }
};
export const NotAllowed = { args: { canSubscribe: false } };
