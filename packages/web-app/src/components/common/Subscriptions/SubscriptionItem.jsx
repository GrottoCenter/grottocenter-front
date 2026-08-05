import PropTypes from 'prop-types';
import { Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { unsubscribeFromMassif } from '../../../actions/Subscriptions/UnsubscribeFromMassif';
import { MassifSimpleTypes } from '../../../types/massif.type';
import countryType from '../../../types/country.type';
import regionType from '../../../types/region.type';
import { unsubscribeFromCountry } from '../../../actions/Subscriptions/UnsubscribeFromCountry';
import { unsubscribeFromRegion } from '../../../actions/Subscriptions/UnsubscribeFromRegion';

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
  const dispatch = useDispatch();
  const url = subscriptionUrl(type, subscription.id);

  const handleUnsubscribe = () => {
    if (type === 'MASSIF')
      dispatch(unsubscribeFromMassif(subscription.id, userId));
    if (type === 'COUNTRY')
      dispatch(unsubscribeFromCountry(subscription.id, userId));
    if (type === 'REGION') {
      // Parse region ID to extract country and region parts (format: "US-AL")
      const [countryId, regionId] = subscription.id.split('-');
      dispatch(unsubscribeFromRegion(countryId, regionId, userId));
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
