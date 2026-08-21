import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import subscriptionsType from '../../../types/subscriptions.type';
import SubscriptionListItem from './SubscriptionItem';
import Alert from '../Alert';
import getLocalizedCountryName from '../../../helpers/countryName';

const SubscriptionsList = ({
  canUnsubscribe,
  subscriptions = { countries: [], massifs: [], regions: [] },
  isLoading = false,
  isError = false,
  userId
}) => {
  const { formatMessage, locale } = useIntl();
  const { countries, massifs, regions } = subscriptions ?? {};

  if (isLoading) return <CircularProgress />;

  if (isError)
    return (
      <Alert
        severity="error"
        content={formatMessage({
          id: 'An error occurred when getting the subscriptions.'
        })}
      />
    );

  const sections = [
    {
      labelId: 'Countries',
      emptyId: 'No country subscriptions',
      items: [...(countries ?? [])]
        .map(c => ({
          ...c,
          name: getLocalizedCountryName(c.id, locale, c.name)
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      type: 'COUNTRY'
    },
    {
      labelId: 'Massifs',
      emptyId: 'No massif subscriptions',
      items: [...(massifs ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
      type: 'MASSIF'
    },
    {
      labelId: 'Regions',
      emptyId: 'No region subscriptions',
      items: [...(regions ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
      type: 'REGION'
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {sections.map(({ labelId, emptyId, items, type }) => (
        <Box key={labelId}>
          <Typography variant="h4" gutterBottom>
            {formatMessage({ id: labelId })}
          </Typography>
          {items.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {items.map(item => (
                <SubscriptionListItem
                  canUnsubscribe={canUnsubscribe}
                  key={item.id}
                  subscription={item}
                  type={type}
                  userId={userId}
                />
              ))}
            </Box>
          ) : (
            <Alert severity="info" content={formatMessage({ id: emptyId })} />
          )}
        </Box>
      ))}
    </Box>
  );
};

SubscriptionsList.propTypes = {
  canUnsubscribe: PropTypes.bool,
  subscriptions: subscriptionsType,
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  userId: PropTypes.number
};

export default SubscriptionsList;
