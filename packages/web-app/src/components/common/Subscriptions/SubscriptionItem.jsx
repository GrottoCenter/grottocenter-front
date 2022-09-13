import React from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Tooltip, Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import NotificationsOffIcon from '@material-ui/icons/NotificationsOff';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import fadeOut from '../../../util/fadeOut';
import { unsubscribeFromMassif } from '../../../actions/Subscriptions/UnsubscribeFromMassif';
import massifType from '../../../types/massif.type';
import countryType from '../../../types/country.type';
import { unsubscribeFromCountry } from '../../../actions/Subscriptions/UnsubscribeFromCountry';

const SubscriptionItem = ({ canUnsubscribe, subscription, type }) => {
  const { formatMessage } = useIntl();
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
    <Box display="flex">
      <Link to={url}>
        <Typography variant="h5" display="inline" gutterBottom>
          {type === 'MASSIF' ? subscription.name : subscription.nativeName}
        </Typography>
      </Link>
      {canUnsubscribe && (
        <Tooltip title={formatMessage({ id: 'Unsubscribe' })}>
          <IconButton color="primary" size="small" onClick={handleUnsubscribe}>
            <NotificationsOffIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
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
