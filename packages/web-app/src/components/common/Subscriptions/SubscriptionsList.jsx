import React from 'react';
import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import subscriptionsType from '../../../types/subscriptions.type';
import Translate from '../Translate';
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
  emptyMessageComponent,
  subscriptions,
  subscriptionsStatus,
  title
}) => {
  const { formatMessage } = useIntl();
  const { countries, massifs } = subscriptions;
  return (
    <>
      {subscriptionsStatus === REDUCER_STATUS.LOADING && <CircularProgress />}
      {subscriptionsStatus === REDUCER_STATUS.FAILED && (
        <Alert
          severity="error"
          content={formatMessage({
            id: 'An error occurred when getting the subscriptions.'
          })}
        />
      )}
      {subscriptionsStatus === REDUCER_STATUS.SUCCEEDED && (
        <>
          {title && (
            <Typography variant="h3" gutterBottom>
              {title}
            </Typography>
          )}
          {subscriptions &&
          (subscriptions.massifs.length > 0 ||
            subscriptions.countries.length > 0) ? (
            <MainContainer>
              <HalfWidthBox>
                <SubscriptionName name={formatMessage({ id: 'Countries' })} />
                {countries.length > 0 ? (
                  <Box display="flex" flexDirection="column" flex={1}>
                    {countries
                      .sort((a, b) => a.nativeName.localeCompare(b.nativeName))
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
                  <Box display="flex" flexDirection="column" flex={1}>
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
          ) : (
            emptyMessageComponent
          )}
        </>
      )}
    </>
  );
};

SubscriptionsList.propTypes = {
  canUnsubscribe: PropTypes.bool,
  emptyMessageComponent: PropTypes.node,
  subscriptions: subscriptionsType,
  subscriptionsStatus: PropTypes.oneOf(Object.values(REDUCER_STATUS)),
  title: PropTypes.node
};

SubscriptionsList.defaultProps = {
  subscriptions: { countries: [], massifs: [] },
  emptyMessageComponent: <Translate>Empty list</Translate>
};

export default SubscriptionsList;
