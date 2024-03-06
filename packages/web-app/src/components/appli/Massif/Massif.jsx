import React from 'react';
import { isNil, isEmpty } from 'ramda';
import Skeleton from '@mui/material/Skeleton';
import { useIntl } from 'react-intl';
import { Box } from '@mui/material';

import Layout from '../../common/Layouts/Fixed/FixedContent';
import CavesList from '../../common/cave/CavesList';
import Alert from '../../common/Alert';
import MassifPropTypes from './propTypes';
import MapMassif from './MapMassif';
import Documents from './Documents';
import Descriptions from './Descriptions';
import { useSubscriptions } from '../../../hooks';
import StatisticsDataDashboard from '../StatisticsDataDashboard';

const Massif = ({
  massifId,
  isFetching,
  error,
  descriptions,
  details,
  documents,
  entrances,
  networks,
  canEdit,
  onEdit,
  canSubscribe,
  onSubscribe,
  onUnsubscribe
}) => {
  const { formatMessage } = useIntl();
  const { isSubscribed: isSubscribedMethod, isMassifLoading: isLoading } =
    useSubscriptions();
  const isSubscribed = details ? isSubscribedMethod(details.id) : false;

  const { geogPolygon, name, names } = details;
  let title = '';
  if (name) {
    title = name;
  } else if (!error) {
    title = formatMessage({ id: 'Loading massif data...' });
  }

  const handleChangeSubscribe = () => {
    if (!isSubscribed) {
      onSubscribe();
    } else {
      onUnsubscribe();
    }
  };

  return (
    <Layout
      onEdit={canEdit ? onEdit : undefined}
      isSubscribed={isSubscribed}
      isSubscribeLoading={isLoading}
      onChangeSubscribe={canSubscribe ? handleChangeSubscribe : undefined}
      title={isFetching ? <Skeleton /> : title}
      subheader={
        isFetching && !error ? (
          <Skeleton />
        ) : (
          names && `${formatMessage({ id: 'Language' })} : ${names[0].language}`
        )
      }
      content={
        <>
          {isFetching && isNil(error) && (
            <>
              <Box style={{ display: 'flex', justifyContent: 'center' }}>
                <Skeleton height={300} width={800} /> {/* Map Skeleton */}
              </Box>
              <Skeleton height={100} /> {/* Documents Skeleton */}
              <Skeleton height={100} /> {/* EntranceList Skeleton */}
              <Skeleton height={100} /> {/* CavesList Skeleton */}
            </>
          )}
          {error && (
            <Alert
              title={formatMessage({
                id: 'Error, the massif data you are looking for is not available.'
              })}
              severity="error"
            />
          )}
          {details && (
            <>
              <Box
                alignItems="start"
                display="flex"
                flexBasis="300px"
                justifyContent="space-between">
                {!isEmpty(descriptions) ? (
                  <Descriptions descriptions={descriptions} />
                ) : (
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This massif has no descriptions listed yet.'
                    })}
                  />
                )}
              </Box>
              {geogPolygon && entrances && (
                <>
                  <hr />
                  <MapMassif entrances={entrances} geogPolygon={geogPolygon} />
                </>
              )}
              <hr />
              <StatisticsDataDashboard massifId={massifId} />
              <hr />
              <Documents documents={documents} massifId={massifId} />
              <hr />
              <CavesList
                caves={networks}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This massif has no networks listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Networks list' })}
              />
            </>
          )}
        </>
      }
    />
  );
};

Massif.propTypes = MassifPropTypes;

export default Massif;
