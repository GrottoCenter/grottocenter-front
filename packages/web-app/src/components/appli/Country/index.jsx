import React from 'react';
import { isEmpty } from 'ramda';
import Skeleton from '@material-ui/lab/Skeleton';
import { useIntl } from 'react-intl';
import { Marker } from 'react-leaflet';
import { Button } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { useHistory } from 'react-router-dom';
import StatisticsDataDashboard from '../StatisticsDataDashboard';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import Layout from '../../common/Layouts/Fixed/FixedContent';
import Alert from '../../common/Alert';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import { CoordinatesMarker } from '../../common/Maps/common/Markers/Components';
import CountryPropTypes from './propTypes';
import { useSubscriptions } from '../../../hooks';

const Country = ({
  canSubscribe,
  country,
  error,
  onSubscribe,
  onUnsubscribe,
  status
}) => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const isLoading = status === REDUCER_STATUS.LOADING;

  const {
    isSubscribed: isSubscribedMethod,
    isCountryLoading: isSubscribeLoading
  } = useSubscriptions();
  const isSubscribed = country ? isSubscribedMethod(country.id) : false;

  let position = [];
  if (country?.latitude && country?.longitude) {
    position = [country?.latitude, country?.longitude];
  }

  const handleChangeSubscribe = () => {
    if (!isSubscribed) {
      onSubscribe();
    } else {
      onUnsubscribe();
    }
  };

  let title = '';
  if (isLoading) title = <Skeleton />;
  if (status === REDUCER_STATUS.SUCCEEDED) title = country.nativeName;

  return (
    <>
      <Button
        style={{ margin: '8px' }}
        variant="outlined"
        onClick={() => {
          history.push(`/ui/countries`);
        }}
        startIcon={<ArrowBackIcon />}
        size="small"
        color="primary">
        {formatMessage({
          id: 'Back to List'
        })}
      </Button>
      <Layout
        title={title}
        isSubscribed={isSubscribed}
        isSubscribeLoading={isSubscribeLoading}
        onChangeSubscribe={canSubscribe ? handleChangeSubscribe : undefined}
        content={
          <>
            {isLoading && <Skeleton height={150} />}
            {error && (
              <Alert
                title={formatMessage({
                  id: 'Error, the country data you are looking for is not available.'
                })}
                severity="error"
              />
            )}
            {!isEmpty(position) && (
              <CustomMapContainer
                center={position}
                dragging
                forceCentering
                scrollWheelZoom={false}
                wholePage={false}
                shouldChangeControlInFullscreen={false}
                zoom={4}>
                <Marker icon={CoordinatesMarker} position={position} />
              </CustomMapContainer>
            )}
            <hr />
            {country && <StatisticsDataDashboard countryId={country?.id} />}
          </>
        }
      />
    </>
  );
};

Country.propTypes = CountryPropTypes;

export default Country;
