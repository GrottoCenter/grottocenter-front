import React from 'react';
import { isEmpty } from 'ramda';
import Skeleton from '@material-ui/lab/Skeleton';
import { useIntl } from 'react-intl';

import { Marker } from 'react-leaflet';
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
  isLoading,
  onSubscribe,
  onUnsubscribe,
  status
}) => {
  const { formatMessage } = useIntl();

  const {
    isSubscribed: isSubscribedMethod,
    isCountryLoading: isSubscribeLoading
  } = useSubscriptions();
  const isSubscribed = country ? isSubscribedMethod(country.id) : false;

  let title = '';
  if (country?.nativeName) {
    title = country.nativeName;
  } else if (!error) {
    title = formatMessage({ id: 'Loading country data...' });
  }

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

  return (
    <Layout
      title={title}
      isSubscribed={isSubscribed}
      isSubscribeLoading={isSubscribeLoading}
      onChangeSubscribe={canSubscribe ? handleChangeSubscribe : undefined}
      content={
        <>
          {status === REDUCER_STATUS.LOADING && <Skeleton height={150} />}
          {error && (
            <Alert
              title={formatMessage({
                id:
                  'Error, the country data you are looking for is not available.'
              })}
              severity="error"
            />
          )}
          {isLoading && <Skeleton />}
          {!isEmpty(position) && (
            <CustomMapContainer
              center={position}
              dragging
              forceCentering
              scrollWheelZoom={false}
              wholePage={false}
              zoom={4}>
              <Marker icon={CoordinatesMarker} position={position} />
            </CustomMapContainer>
          )}
        </>
      }
    />
  );
};

Country.propTypes = CountryPropTypes;

export default Country;
