import React from 'react';
import PropTypes from 'prop-types';
import { Chip, Tooltip } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import NotificationsIcon from '@mui/icons-material/Notifications';
import fadeOut from '../../../util/fadeOut';
import { unsubscribeFromMassif } from '../../../actions/Subscriptions/UnsubscribeFromMassif';
import massifType from '../../../types/massif.type';
import countryType from '../../../types/country.type';
import { unsubscribeFromCountry } from '../../../actions/Subscriptions/UnsubscribeFromCountry';

const SubscriptionItem = ({ canUnsubscribe, subscription, type }) => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const dispatch = useDispatch();
  const url =
    type === 'MASSIF'
      ? `/ui/massifs/${subscription.id}`
      : `/ui/countries/${subscription.id}`;

  const handleUnsubscribe = event => {
    const unsubscribe = () => {
      if (type === 'MASSIF') dispatch(unsubscribeFromMassif(subscription.id));
      if (type === 'COUNTRY') dispatch(unsubscribeFromCountry(subscription.id));
    };
    fadeOut(event.currentTarget.closest('div'), unsubscribe);
  };

  return (
    <Tooltip title={formatMessage({ id: 'Click the cross to unsubscribe' })}>
      <Chip
        icon={<NotificationsIcon />}
        label={type === 'MASSIF' ? subscription.name : subscription.nativeName}
        onClick={() => history.push(url)}
        onDelete={canUnsubscribe ? handleUnsubscribe : undefined}
        color="primary"
      />
    </Tooltip>
  );
};

SubscriptionItem.propTypes = {
  canUnsubscribe: PropTypes.bool,
  subscription: PropTypes.oneOfType([countryType, massifType]),
  type: PropTypes.oneOf(['COUNTRY', 'MASSIF']).isRequired
};
SubscriptionItem.defaultProps = {
  subscription: undefined
};

export default SubscriptionItem;
