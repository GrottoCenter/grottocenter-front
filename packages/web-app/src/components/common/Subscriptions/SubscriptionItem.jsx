import React from 'react';
import PropTypes from 'prop-types';
import { Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import NotificationsIcon from '@mui/icons-material/Notifications';
import fadeOut from '../../../util/fadeOut';
import { unsubscribeFromMassif } from '../../../actions/Subscriptions/UnsubscribeFromMassif';
import { MassifSimpleTypes } from '../../../types/massif.type';
import countryType from '../../../types/country.type';
import regionType from '../../../types/region.type';
import { unsubscribeFromCountry } from '../../../actions/Subscriptions/UnsubscribeFromCountry';
import { unsubscribeFromRegion } from '../../../actions/Subscriptions/UnsubscribeFromRegion';

const SubscriptionItem = ({ canUnsubscribe, subscription, type, userId }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const url =
    type === 'MASSIF'
      ? `/ui/massifs/${subscription.id}`
      : type === 'REGION'
      ? (() => {
          // Parse region ID to extract country and region parts (format: "US-AL")
          const [countryId, regionId] = subscription.id.split('-');
          return `/ui/countries/${countryId}/regions/${regionId}`;
        })()
      : `/ui/countries/${subscription.id}`;

  const handleUnsubscribe = event => {
    const unsubscribe = () => {
      if (type === 'MASSIF') dispatch(unsubscribeFromMassif(subscription.id, userId));
      if (type === 'COUNTRY') dispatch(unsubscribeFromCountry(subscription.id, userId));
      if (type === 'REGION') {
        // Parse region ID to extract country and region parts (format: "US-AL")
        const [countryId, regionId] = subscription.id.split('-');
        dispatch(unsubscribeFromRegion(countryId, regionId, userId));
      }
    };
    fadeOut(event.currentTarget.closest('div'), unsubscribe);
  };

  return (
    <Tooltip
      title={
        canUnsubscribe
          ? formatMessage({ id: 'Click the cross to unsubscribe' })
          : ''
      }>
      <Chip
        icon={<NotificationsIcon />}
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
  subscription: PropTypes.oneOfType([countryType, MassifSimpleTypes, regionType]),
  type: PropTypes.oneOf(['COUNTRY', 'MASSIF', 'REGION']).isRequired,
  userId: PropTypes.number
};

export default SubscriptionItem;
