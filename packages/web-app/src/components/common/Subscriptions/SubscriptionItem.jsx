import PropTypes from 'prop-types';
import { Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import {
  useUnsubscribeFromCountry,
  useUnsubscribeFromMassif,
  useUnsubscribeFromRegion
} from '../../../hooks';
import { MassifSimpleTypes } from '../../../types/massif.type';
import countryType from '../../../types/country.type';
import regionType from '../../../types/region.type';

// A region id encodes its country: "US-AL" is Alabama in the United States.
const subscriptionUrl = (type, id) => {
  if (type === 'MASSIF') return `/ui/massifs/${id}`;
  if (type !== 'REGION') return `/ui/countries/${id}`;
  const [countryId, regionId] = id.split('-');
  return `/ui/countries/${countryId}/regions/${regionId}`;
};

const SubscriptionItem = ({ canUnsubscribe, subscription, type, userId }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const url = subscriptionUrl(type, subscription.id);
  const unsubscribeCountry = useUnsubscribeFromCountry();
  const unsubscribeMassif = useUnsubscribeFromMassif();
  const unsubscribeRegion = useUnsubscribeFromRegion();

  const handleUnsubscribe = () => {
    if (type === 'MASSIF')
      unsubscribeMassif.mutate({ massifId: subscription.id, userId });
    if (type === 'COUNTRY')
      unsubscribeCountry.mutate({ countryId: subscription.id, userId });
    if (type === 'REGION') {
      // Parse region ID to extract country and region parts (format: "US-AL")
      const [countryId, regionId] = subscription.id.split('-');
      unsubscribeRegion.mutate({ countryId, regionId, userId });
    }
  };

  return (
    <Tooltip
      title={
        canUnsubscribe
          ? formatMessage({ id: 'Click the cross to unsubscribe' })
          : ''
      }>
      <Chip
        icon={<NotificationsActiveIcon />}
        label={subscription.name}
        onClick={() => navigate(url)}
        onDelete={canUnsubscribe ? handleUnsubscribe : undefined}
        color="primary"
      />
    </Tooltip>
  );
};

SubscriptionItem.propTypes = {
  canUnsubscribe: PropTypes.bool,
  subscription: PropTypes.oneOfType([
    countryType,
    MassifSimpleTypes,
    regionType
  ]),
  type: PropTypes.oneOf(['COUNTRY', 'MASSIF', 'REGION']).isRequired,
  userId: PropTypes.number
};

export default SubscriptionItem;
