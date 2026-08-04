import { useRef } from 'react';
import Skeleton from '@mui/material/Skeleton';
import { useIntl } from 'react-intl';
import { Marker } from 'react-leaflet';
import { Button, Card, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Print } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useReactToPrint } from 'react-to-print';
import { isMobile } from 'react-device-detect';
import CustomIcon from '../../common/CustomIcon';

import Guidelines from '../Guidelines';
import StatisticsDataDashboard from '../StatisticsDataDashboard';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import PageContainer from '../../common/Layouts/PageContainer';
import PageHeader from '../../common/Layouts/PageHeader';
import SectionStack from '../../common/Layouts/SectionStack';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import Alert from '../../common/Alert';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import { CoordinatesMarker } from '../../common/Maps/common/Markers/Components';
import {
  usePermissions,
  useSubscriptions,
  useScrollToHashOnLoad,
  useSharePage
} from '../../../hooks';
import AssociationSection from '../OrganizationAssociation';

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
  const componentRef = useRef();
  const permissions = usePermissions();
  const isLoading = status === REDUCER_STATUS.LOADING;
  const handleShare = useSharePage();
  const handlePrint = useReactToPrint({ contentRef: componentRef });

  const {
    isSubscribed: isSubscribedMethod,
    isRegionLoading: isSubscribeLoading
  } = useSubscriptions();
  const isSubscribed = region ? isSubscribedMethod(region.id) : false;

  const { statistics: dataRegion } = useSelector(
    state => state.statisticsRegion
  );
  useScrollToHashOnLoad(dataRegion);

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

  let SubscribeIcon = <CircularProgress size={20} />;
  if (!isSubscribeLoading) {
    SubscribeIcon = isSubscribed ? (
      <NotificationsActiveIcon />
    ) : (
      <NotificationsNoneIcon />
    );
  }

  const actions = region ? (
    <ResponsiveActions
      items={[
        {
          key: 'subscribe',
          icon: SubscribeIcon,
          label: formatMessage({
            id: isSubscribed ? 'Unsubscribe' : 'Subscribe'
          }),
          onClick: handleChangeSubscribe,
          color: isSubscribed ? 'secondary' : 'primary',
          hidden: !canSubscribe
        },
        {
          key: 'print',
          icon: <Print />,
          label: formatMessage({ id: 'Print' }),
          onClick: handlePrint
        },
        {
          key: 'share',
          icon: <ShareIcon />,
          label: formatMessage({ id: 'Copy link' }),
          onClick: handleShare
        }
      ]}
    />
  ) : null;

  const subheader = (
    <Button
      variant="outlined"
      onClick={() => navigate(`/ui/countries/${countryId}`)}
      startIcon={<ArrowBackIcon />}
      size="small"
      color="primary">
      {formatMessage({ id: 'Back to Country' })}
    </Button>
  );

  return (
    <PageContainer>
      <div ref={componentRef}>
        <PageHeader
          title={region?.name ?? (isLoading ? undefined : '')}
          subheader={subheader}
          actions={actions}
        />
        {isLoading && (
          <SectionStack>
            <Card sx={{ p: 2 }}>
              <Skeleton height={150} />
            </Card>
          </SectionStack>
        )}
        {error && (
          <SectionStack>
            <Card sx={{ p: 2 }}>
              <Alert
                title={formatMessage({
                  id: 'Error, the region data you are looking for is not available.'
                })}
                severity="error"
              />
            </Card>
          </SectionStack>
        )}
        {region && (
          <SectionStack>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={<CustomIcon type="entrance" size={24} />}
              onClick={() =>
                navigate(
                  `/ui/countries/${countryId}/regions/${regionId}/entrances`
                )
              }>
              {formatMessage({ id: 'Entrances list' })}
              {dataRegion?.nb_caves ? ` (${dataRegion.nb_caves})` : ''}
            </Button>
            {position && (
              <ScrollableContent
                content={
                  <CustomMapContainer
                    center={position}
                    dragging={!isMobile}
                    forceCentering
                    scrollWheelZoom={false}
                    wholePage={false}
                    shouldChangeControlInFullscreen={false}
                    zoom={6}>
                    <Marker icon={CoordinatesMarker} position={position} />
                  </CustomMapContainer>
                }
              />
            )}
            <StatisticsDataDashboard
              regionId={regionId}
              countryId={countryId}
              description={formatMessage({
                id: 'Discover the numbers about this region and its caves.'
              })}
            />
            {(region.guidelines?.length > 0 || permissions.isAuth) && (
              <Guidelines
                entityType="regions"
                entityId={region.id}
                guidelines={region.guidelines}
              />
            )}
            <AssociationSection
              organizations={region?.organizations}
              entityType="region"
              entityId={regionId}
              parentEntityId={countryId}
              isLoading={isLoading}
            />
          </SectionStack>
        )}
      </div>
    </PageContainer>
  );
};

Region.propTypes = {
  canSubscribe: PropTypes.bool,
  region: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    guidelines: PropTypes.array
  }),
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onSubscribe: PropTypes.func,
  onUnsubscribe: PropTypes.func,
  status: PropTypes.string,
  countryId: PropTypes.string,
  regionId: PropTypes.string
};

export default Region;
