import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import { useIntl } from 'react-intl';
import { Marker } from 'react-leaflet';
import { Box, Button, Card } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

import StatisticsDataDashboard from '../StatisticsDataDashboard';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import FixedLayout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import Alert from '../../common/Alert';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import { CoordinatesMarker } from '../../common/Maps/common/Markers/Components';
import { useSubscriptions } from '../../../hooks';

const Region = ({
  canSubscribe,
  region,
  error,
  onSubscribe,
  onUnsubscribe,
  status,
  countryId,
  regionId
}) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const isLoading = status === REDUCER_STATUS.LOADING;

  const {
    isSubscribed: isSubscribedMethod,
    isRegionLoading: isSubscribeLoading
  } = useSubscriptions();
  const isSubscribed = region ? isSubscribedMethod(region.id) : false;

  const handleChangeSubscribe = () => {
    if (!isSubscribed) {
      onSubscribe();
    } else {
      onUnsubscribe();
    }
  };

  const position =
    region?.latitude && region?.longitude
      ? [region.latitude, region.longitude]
      : null;

  return (
    <FixedLayout>
      <Box sx={{ margin: '8px' }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/ui/countries/${countryId}`)}
          startIcon={<ArrowBackIcon />}
          size="small"
          color="primary">
          {formatMessage({ id: 'Back to Country' })}
        </Button>
      </Box>
      {region && (
        <FixedContent
          title={region.name}
          isSubscribed={isSubscribed}
          isSubscribeLoading={isSubscribeLoading}
          onChangeSubscribe={canSubscribe ? handleChangeSubscribe : undefined}
          content={
            position && (
              <CustomMapContainer
                center={position}
                dragging
                forceCentering
                scrollWheelZoom={false}
                wholePage={false}
                shouldChangeControlInFullscreen={false}
                zoom={6}>
                <Marker icon={CoordinatesMarker} position={position} />
              </CustomMapContainer>
            )
          }
        />
      )}
      {isLoading && (
        <Card sx={{ padding: 3 }}>
          <Skeleton height={150} />
        </Card>
      )}
      {error && (
        <Card sx={{ padding: 3 }}>
          <Alert
            title={formatMessage({
              id: 'Error, the region data you are looking for is not available.'
            })}
            severity="error"
          />
        </Card>
      )}
      {region && (
        <ScrollableContent
          anchorId="statistics"
          title={formatMessage({ id: 'More information' })}
          content={
            <StatisticsDataDashboard
              regionId={regionId}
              countryId={countryId}
              hideTitle
            />
          }
        />
      )}
    </FixedLayout>
  );
};

Region.propTypes = {
  canSubscribe: PropTypes.bool,
  region: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number
  }),
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onSubscribe: PropTypes.func,
  onUnsubscribe: PropTypes.func,
  status: PropTypes.string,
  countryId: PropTypes.string,
  regionId: PropTypes.string
};

export default Region;
