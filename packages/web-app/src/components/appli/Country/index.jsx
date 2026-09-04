import { useRef } from 'react';
import { isEmpty } from 'ramda';
import Skeleton from '@mui/material/Skeleton';
import { useIntl } from 'react-intl';
import { Marker } from 'react-leaflet';
import { Box, Button, Card, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Print } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { isMobile } from 'react-device-detect';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import StatisticsDataDashboard from '../StatisticsDataDashboard';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import PageContainer from '../../common/Layouts/PageContainer';
import PageHeader from '../../common/Layouts/PageHeader';
import SectionStack from '../../common/Layouts/SectionStack';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import FetchErrorState from '../../common/FetchErrorState';
import { CoordinatesMarker } from '../../common/Maps/common/Markers/Components';
import CountryPropTypes from './propTypes';
import {
  usePermissions,
  useStatisticsCountry,
  useSubscriptions,
  useSharePage
} from '../../../hooks';
import getLocalizedCountryName from '../../../helpers/countryName';
import CustomIcon from '../../common/CustomIcon';
import Guidelines from '../Guidelines';
import RegionsList from './RegionsList';
import AssociationSection from '../OrganizationAssociation';

const Country = ({
  canSubscribe,
  country,
  error,
  isPaused = false,
  isFetching = false,
  onRetry = null,
  onSubscribe,
  onUnsubscribe
}) => {
  const { formatMessage, locale } = useIntl();
  const navigate = useNavigate();
  const componentRef = useRef();
  const isLoading = isFetching && !country;
  const permissions = usePermissions();
  const handleShare = useSharePage();
  const handlePrint = useReactToPrint({ contentRef: componentRef });

  const {
    isSubscribed: isSubscribedMethod,
    isCountryLoading: isSubscribeLoading
  } = useSubscriptions();
  const isSubscribed = country ? isSubscribedMethod(country.id) : false;

  const { data: dataCountry } = useStatisticsCountry(country?.id);

  const position =
    country?.latitude && country?.longitude
      ? [country.latitude, country.longitude]
      : [];

  const handleChangeSubscribe = () => {
    if (!isSubscribed) onSubscribe();
    else onUnsubscribe();
  };

  let title = '';
  if (isLoading) title = undefined;
  if (country) {
    title = getLocalizedCountryName(country.id, locale, country.nativeName);
  }

  let SubscribeIcon = <CircularProgress size={20} />;
  if (!isSubscribeLoading) {
    SubscribeIcon = isSubscribed ? (
      <NotificationsActiveIcon />
    ) : (
      <NotificationsNoneIcon />
    );
  }

  const actions = country ? (
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
      onClick={() => navigate('/ui/countries')}
      startIcon={<ArrowBackIcon />}
      size="small"
      color="primary">
      {formatMessage({ id: 'Back to List' })}
    </Button>
  );

  return (
    <PageContainer>
      <div ref={componentRef}>
        <PageHeader
          title={title}
          icon={<CustomIcon type="country" />}
          subheader={subheader}
          actions={actions}
        />
        {isLoading && (
          <SectionStack>
            <Card sx={{ p: 2 }}>
              <Skeleton height={300} />
              <Skeleton height={100} />
            </Card>
          </SectionStack>
        )}
        {(error || isPaused) && (
          <SectionStack>
            <Card sx={{ p: 2 }}>
              <FetchErrorState
                error={error}
                isPaused={isPaused}
                onRetry={onRetry}
                messageId="Error, the country data you are looking for is not available."
              />
            </Card>
          </SectionStack>
        )}
        {country && (
          <SectionStack>
            {!isEmpty(position) && (
              <ScrollableContent
                content={
                  <Box sx={{ minHeight: 200 }}>
                    <CustomMapContainer
                      center={position}
                      dragging={!isMobile}
                      forceCentering
                      scrollWheelZoom={false}
                      wholePage={false}
                      shouldChangeControlInFullscreen={false}
                      zoom={4}>
                      <Marker icon={CoordinatesMarker} position={position} />
                    </CustomMapContainer>
                  </Box>
                }
              />
            )}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={<CustomIcon type="entrance" size={24} />}
              onClick={() => navigate(`/ui/countries/${country.id}/entrances`)}>
              {formatMessage({ id: 'Entrances list' })}
              {dataCountry?.nb_caves ? ` (${dataCountry.nb_caves})` : ''}
            </Button>
            <StatisticsDataDashboard
              countryId={country.id}
              description={formatMessage({
                id: 'Discover the numbers about this country and its massifs and caves.'
              })}
            />
            {(country.guidelines?.length > 0 || permissions.isAuth) && (
              <Guidelines
                entityType="countries"
                entityId={country.id}
                entityName={title}
                guidelines={country.guidelines}
              />
            )}
            <AssociationSection
              organizations={country?.organizations}
              entityType="country"
              entityId={country?.id}
              isLoading={isLoading}
            />
            <ScrollableContent
              anchorId="regions"
              title={formatMessage({ id: 'Regions' })}
              content={<RegionsList countryId={country.id} />}
            />
          </SectionStack>
        )}
      </div>
    </PageContainer>
  );
};

Country.propTypes = CountryPropTypes;

export default Country;
