import React, { useRef } from 'react';
import { isEmpty } from 'ramda';
import Skeleton from '@mui/material/Skeleton';
import { useIntl } from 'react-intl';
import { Marker } from 'react-leaflet';
import { Box, Button, Card } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import StatisticsDataDashboard from '../StatisticsDataDashboard';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import FixedLayout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import Alert from '../../common/Alert';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import { CoordinatesMarker } from '../../common/Maps/common/Markers/Components';
import CountryPropTypes from './propTypes';
import { isMobile } from 'react-device-detect';
import { useSubscriptions } from '../../../hooks';
import getLocalizedCountryName from '../../../helpers/countryName';
import CustomIcon from '../../common/CustomIcon';
import RegionsList from './RegionsList';

const Country = ({
  canSubscribe,
  country,
  error,
  onSubscribe,
  onUnsubscribe,
  status
}) => {
  const { formatMessage, locale } = useIntl();
  const navigate = useNavigate();
  const componentRef = useRef();
  const isLoading = status === REDUCER_STATUS.LOADING;

  const {
    isSubscribed: isSubscribedMethod,
    isCountryLoading: isSubscribeLoading
  } = useSubscriptions();
  const isSubscribed = country ? isSubscribedMethod(country.id) : false;

  const position =
    country?.latitude && country?.longitude
      ? [country.latitude, country.longitude]
      : [];

  const handleChangeSubscribe = () => {
    if (!isSubscribed) onSubscribe();
    else onUnsubscribe();
  };

  let title = '';
  if (isLoading) title = <Skeleton />;
  if (status === REDUCER_STATUS.SUCCEEDED) {
    title = getLocalizedCountryName(
      country,
      formatMessage,
      locale,
      country.nativeName
    );
  }

  return (
    <div ref={componentRef}>
    <FixedLayout>
      {country && (
        <FixedContent
          displayShare
          title={title}
          icon={<CustomIcon type="country" />}
          printRef={componentRef}
          isSubscribed={isSubscribed}
          isSubscribeLoading={isSubscribeLoading}
          onChangeSubscribe={canSubscribe ? handleChangeSubscribe : undefined}
          subheader={
            <Button
              variant="outlined"
              onClick={() => navigate('/ui/countries')}
              startIcon={<ArrowBackIcon />}
              size="small"
              color="primary">
              {formatMessage({ id: 'Back to List' })}
            </Button>
          }
          content={
            !isEmpty(position) && (
              <Box sx={{ minHeight: 200 }}>
                <CustomMapContainer
                  center={position}
                  dragging={!isMobile} // For usability only use two fingers drag/zoom on mobile
                  forceCentering
                  scrollWheelZoom={false}
                  wholePage={false}
                  shouldChangeControlInFullscreen={false}
                  zoom={4}>
                  <Marker icon={CoordinatesMarker} position={position} />
                </CustomMapContainer>
              </Box>
            )
          }
        />
      )}
      {isLoading && (
        <Card sx={{ padding: 3 }}>
          <Skeleton height={300} />
          <Skeleton height={100} />
        </Card>
      )}
      {error && (
        <Card sx={{ padding: 3 }}>
          <Alert
            title={formatMessage({
              id: 'Error, the country data you are looking for is not available.'
            })}
            severity="error"
          />
        </Card>
      )}
      {country && (
        <>
          <StatisticsDataDashboard
            countryId={country.id}
            description={formatMessage({
              id: 'Discover the numbers about this country and its massifs and caves.'
            })}
          />
          <ScrollableContent
            anchorId="regions"
            title={formatMessage({ id: 'Regions' })}
            content={<RegionsList countryId={country.id} />}
          />
        </>
      )}
    </FixedLayout>
    </div>
  );
};

Country.propTypes = CountryPropTypes;

export default Country;
