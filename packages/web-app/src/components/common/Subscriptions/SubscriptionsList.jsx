import React from 'react';
import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import subscriptionsType from '../../../types/subscriptions.type';
import SubscriptionListItem from './SubscriptionItem';
import Alert from '../Alert';
import SubscriptionName from './SubscriptionName';

const MainContainer = styled(Box)`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
`;

const HalfWidthBox = ({ children }) => (
  <Box width="50%" minWidth="320px" display="flex" flex={1} alignItems="center">
    {children}
  </Box>
);
HalfWidthBox.propTypes = {
  children: PropTypes.node
};

const SubscriptionsList = ({
  canUnsubscribe,
  subscriptions,
  subscriptionsStatus,
  title
}) => {
  const { formatMessage } = useIntl();
  const { countries, massifs } = subscriptions ?? {};

  if (subscriptionsStatus === REDUCER_STATUS.LOADING)
    return <CircularProgress />;

  if (subscriptionsStatus === REDUCER_STATUS.SUCCEEDED)
    return subscriptions &&
      (subscriptions.massifs.length > 0 ||
        subscriptions.countries.length > 0) ? (
      <>
        {title && (
          <Typography variant="h3" gutterBottom>
            {title}
          </Typography>
        )}
        <MainContainer>
          <HalfWidthBox>
            <SubscriptionName name={formatMessage({ id: 'Countries' })} />
            {countries.length > 0 ? (
              <Box>
                {countries
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(country => (
                    <SubscriptionListItem
                      canUnsubscribe={canUnsubscribe}
                      key={country.id}
                      subscription={country}
                      type="COUNTRY"
                    />
                  ))}
              </Box>
            ) : (
              <Alert
                severity="info"
                title={formatMessage({ id: 'No country subscriptions' })}
              />
            )}
          </HalfWidthBox>
          <HalfWidthBox>
            <SubscriptionName name={formatMessage({ id: 'Massifs' })} />
            {massifs.length > 0 ? (
              <Box>
                {massifs
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(massif => (
                    <SubscriptionListItem
                      canUnsubscribe={canUnsubscribe}
                      key={massif.id}
                      subscription={massif}
                      type="MASSIF"
                    />
                  ))}
              </Box>
            ) : (
              <Box width="100%">
                <Alert
                  severity="info"
                  title={formatMessage({ id: 'No massif subscriptions' })}
                />
              </Box>
            )}
          </HalfWidthBox>
        </MainContainer>
        <hr />
      </>
    ) : (
      false
    );

  return (
    <Alert
      severity="error"
      content={formatMessage({
        id: 'An error occurred when getting the subscriptions.'
      })}
    />
  );
};

SubscriptionsList.propTypes = {
  canUnsubscribe: PropTypes.bool,
  subscriptions: subscriptionsType,
  subscriptionsStatus: PropTypes.oneOf(Object.values(REDUCER_STATUS)),
  title: PropTypes.node
};

export default SubscriptionsList;
